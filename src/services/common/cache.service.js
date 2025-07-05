

'use strict';

const crypto = require('crypto');


class CacheService {
    constructor(redis, logger) {
        this.redis = redis;
        this.logger = logger;

        
        this.config = {
            
            keyPrefix: process.env.CACHE_PREFIX || 'y24:',

            
            defaultTTL: {
                userProfile: 3600,      
                serviceList: 86400,     
                cityGrid: 604800,       
                shortTerm: 300,         
                longTerm: 86400,        
                permanent: 0            
            },

            
            serialization: {
                compress: true,         
                compressionThreshold: 1024, 
                useMessagePack: false   
            },

            
            stampede: {
                enabled: true,
                lockTimeout: 5000,      
                staleTimeout: 60000     
            },

            
            types: {
                json: { compress: true },
                string: { compress: false },
                buffer: { compress: true },
                number: { compress: false },
                boolean: { compress: false }
            },

            
            stats: {
                enabled: true,
                sampleRate: 0.1         
            }
        };

        
        this.NAMESPACES = {
            USER: 'user',
            ORDER: 'order',
            MASTER: 'master',
            SERVICE: 'service',
            GEO: 'geo',
            CONFIG: 'config',
            SESSION: 'session',
            TEMP: 'temp'
        };

        
        this.STRATEGIES = {
            CACHE_ASIDE: 'cache_aside',         
            WRITE_THROUGH: 'write_through',     
            WRITE_BEHIND: 'write_behind',       
            REFRESH_AHEAD: 'refresh_ahead',     
            READ_THROUGH: 'read_through'        
        };

        
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0
        };

        
        this.loaders = new Map();

        
        this.refreshTimers = new Map();
    }

    
    async get(key, options = {}) {
        const {
            namespace = null,
            loader = null,          
            ttl = null,            
            parse = true,          
            decompress = true      
        } = options;

        try {
            const fullKey = this.buildKey(key, namespace);

            
            const cached = await this.redis.get(fullKey);

            if (cached !== null) {
                
                this.recordHit();

                
                const value = await this.deserialize(cached, { parse, decompress });

                this.logger.debug({
                    action: 'cache_hit',
                    key: fullKey
                }, 'Cache hit');

                return value;
            }

            
            this.recordMiss();

            this.logger.debug({
                action: 'cache_miss',
                key: fullKey
            }, 'Cache miss');

            
            if (loader) {
                return await this.loadThrough(key, loader, { namespace, ttl });
            }

            return null;

        } catch (error) {
            this.recordError();

            this.logger.error({
                action: 'cache_get_error',
                key,
                error: error.message
            }, 'Cache get error');

            
            return null;
        }
    }

    
    async set(key, value, options = {}) {
        const {
            namespace = null,
            ttl = this.config.defaultTTL.shortTerm,
            tags = [],              
            compress = null,        
            ifNotExists = false,    
            ifExists = false        
        } = options;

        try {
            const fullKey = this.buildKey(key, namespace);

            
            const serialized = await this.serialize(value, { compress });

            
            let result;
            if (ttl > 0) {
                if (ifNotExists) {
                    result = await this.redis.set(fullKey, serialized, 'EX', ttl, 'NX');
                } else if (ifExists) {
                    result = await this.redis.set(fullKey, serialized, 'EX', ttl, 'XX');
                } else {
                    result = await this.redis.setex(fullKey, ttl, serialized);
                }
            } else {
                if (ifNotExists) {
                    result = await this.redis.set(fullKey, serialized, 'NX');
                } else if (ifExists) {
                    result = await this.redis.set(fullKey, serialized, 'XX');
                } else {
                    result = await this.redis.set(fullKey, serialized);
                }
            }

            
            if (tags.length > 0) {
                await this.addTags(fullKey, tags);
            }

            this.recordSet();

            this.logger.debug({
                action: 'cache_set',
                key: fullKey,
                ttl,
                tags
            }, 'Cache set');

            return result === 'OK';

        } catch (error) {
            this.recordError();

            this.logger.error({
                action: 'cache_set_error',
                key,
                error: error.message
            }, 'Cache set error');

            return false;
        }
    }

    
    async delete(key, options = {}) {
        const {
            namespace = null,
            pattern = false         
        } = options;

        try {
            let deleted = 0;

            if (pattern) {
                
                const fullPattern = this.buildKey(key, namespace);
                const keys = await this.redis.keys(fullPattern);

                if (keys.length > 0) {
                    deleted = await this.redis.del(...keys);
                }
            } else {
                
                const fullKey = this.buildKey(key, namespace);
                deleted = await this.redis.del(fullKey);
            }

            this.recordDelete(deleted);

            this.logger.debug({
                action: 'cache_delete',
                key,
                deleted
            }, 'Cache delete');

            return deleted;

        } catch (error) {
            this.recordError();

            this.logger.error({
                action: 'cache_delete_error',
                key,
                error: error.message
            }, 'Cache delete error');

            return 0;
        }
    }

    
    async mget(keys, options = {}) {
        const { namespace = null } = options;

        try {
            const fullKeys = keys.map(key => this.buildKey(key, namespace));
            const values = await this.redis.mget(...fullKeys);

            const result = {};
            for (let i = 0; i < keys.length; i++) {
                if (values[i] !== null) {
                    result[keys[i]] = await this.deserialize(values[i]);
                    this.recordHit();
                } else {
                    this.recordMiss();
                }
            }

            return result;

        } catch (error) {
            this.recordError();

            this.logger.error({
                action: 'cache_mget_error',
                error: error.message
            }, 'Cache mget error');

            return {};
        }
    }

    
    async mset(keyValues, options = {}) {
        const {
            namespace = null,
            ttl = this.config.defaultTTL.shortTerm
        } = options;

        try {
            const pipeline = this.redis.pipeline();

            for (const [key, value] of Object.entries(keyValues)) {
                const fullKey = this.buildKey(key, namespace);
                const serialized = await this.serialize(value);

                if (ttl > 0) {
                    pipeline.setex(fullKey, ttl, serialized);
                } else {
                    pipeline.set(fullKey, serialized);
                }
            }

            await pipeline.exec();

            this.recordSet(Object.keys(keyValues).length);

            return true;

        } catch (error) {
            this.recordError();

            this.logger.error({
                action: 'cache_mset_error',
                error: error.message
            }, 'Cache mset error');

            return false;
        }
    }

    
    async invalidateByTags(tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        let invalidated = 0;

        try {
            for (const tag of tagArray) {
                const tagKey = this.buildKey(`tag:${tag}`, 'meta');
                const keys = await this.redis.smembers(tagKey);

                if (keys.length > 0) {
                    invalidated += await this.redis.del(...keys);
                    await this.redis.del(tagKey);
                }
            }

            this.logger.info({
                action: 'cache_invalidate_by_tags',
                tags: tagArray,
                invalidated
            }, 'Cache invalidated by tags');

            return invalidated;

        } catch (error) {
            this.logger.error({
                action: 'cache_invalidate_error',
                tags: tagArray,
                error: error.message
            }, 'Cache invalidate error');

            return 0;
        }
    }

    
    async exists(key, options = {}) {
        const { namespace = null } = options;

        try {
            const fullKey = this.buildKey(key, namespace);
            return await this.redis.exists(fullKey) === 1;
        } catch (error) {
            return false;
        }
    }

    
    async ttl(key, options = {}) {
        const { namespace = null } = options;

        try {
            const fullKey = this.buildKey(key, namespace);
            return await this.redis.ttl(fullKey);
        } catch (error) {
            return -1;
        }
    }

    
    async expire(key, ttl, options = {}) {
        const { namespace = null } = options;

        try {
            const fullKey = this.buildKey(key, namespace);
            return await this.redis.expire(fullKey, ttl) === 1;
        } catch (error) {
            return false;
        }
    }

    
    async increment(key, amount = 1, options = {}) {
        const {
            namespace = null,
            ttl = null
        } = options;

        try {
            const fullKey = this.buildKey(key, namespace);

            const newValue = amount === 1
                ? await this.redis.incr(fullKey)
                : await this.redis.incrby(fullKey, amount);

            if (ttl && newValue === amount) {
                
                await this.redis.expire(fullKey, ttl);
            }

            return newValue;

        } catch (error) {
            this.logger.error({
                action: 'cache_increment_error',
                key,
                error: error.message
            }, 'Cache increment error');

            return 0;
        }
    }

    
    async decrement(key, amount = 1, options = {}) {
        const { namespace = null } = options;

        try {
            const fullKey = this.buildKey(key, namespace);

            return amount === 1
                ? await this.redis.decr(fullKey)
                : await this.redis.decrby(fullKey, amount);

        } catch (error) {
            return 0;
        }
    }

    
    async listPush(key, value, options = {}) {
        const {
            namespace = null,
            position = 'right',     
            maxLength = null,       
            ttl = null
        } = options;

        try {
            const fullKey = this.buildKey(key, namespace);
            const serialized = await this.serialize(value);

            const length = position === 'left'
                ? await this.redis.lpush(fullKey, serialized)
                : await this.redis.rpush(fullKey, serialized);

            
            if (maxLength && length > maxLength) {
                await this.redis.ltrim(fullKey, -maxLength, -1);
            }

            
            if (ttl && length === 1) {
                await this.redis.expire(fullKey, ttl);
            }

            return length;

        } catch (error) {
            return 0;
        }
    }

    
    async listGet(key, options = {}) {
        const {
            namespace = null,
            start = 0,
            end = -1
        } = options;

        try {
            const fullKey = this.buildKey(key, namespace);
            const items = await this.redis.lrange(fullKey, start, end);

            return await Promise.all(
                items.map(item => this.deserialize(item))
            );

        } catch (error) {
            return [];
        }
    }

    
    async setAdd(key, members, options = {}) {
        const {
            namespace = null,
            ttl = null
        } = options;

        try {
            const fullKey = this.buildKey(key, namespace);
            const membersArray = Array.isArray(members) ? members : [members];

            const serialized = await Promise.all(
                membersArray.map(m => this.serialize(m))
            );

            const added = await this.redis.sadd(fullKey, ...serialized);

            
            if (ttl && added === membersArray.length) {
                await this.redis.expire(fullKey, ttl);
            }

            return added;

        } catch (error) {
            return 0;
        }
    }

    
    async setMembers(key, options = {}) {
        const { namespace = null } = options;

        try {
            const fullKey = this.buildKey(key, namespace);
            const members = await this.redis.smembers(fullKey);

            return await Promise.all(
                members.map(m => this.deserialize(m))
            );

        } catch (error) {
            return [];
        }
    }

    
    async hashSet(key, field, value, options = {}) {
        const { namespace = null, ttl = null } = options;

        try {
            const fullKey = this.buildKey(key, namespace);

            if (typeof field === 'object') {
                
                const entries = [];
                for (const [f, v] of Object.entries(field)) {
                    entries.push(f, await this.serialize(v));
                }
                await this.redis.hmset(fullKey, ...entries);
            } else {
                
                const serialized = await this.serialize(value);
                await this.redis.hset(fullKey, field, serialized);
            }

            if (ttl) {
                await this.redis.expire(fullKey, ttl);
            }

            return true;

        } catch (error) {
            return false;
        }
    }

    
    async hashGet(key, field = null, options = {}) {
        const { namespace = null } = options;

        try {
            const fullKey = this.buildKey(key, namespace);

            if (field === null) {
                
                const hash = await this.redis.hgetall(fullKey);
                const result = {};

                for (const [f, v] of Object.entries(hash)) {
                    result[f] = await this.deserialize(v);
                }

                return result;
            } else if (Array.isArray(field)) {
                
                const values = await this.redis.hmget(fullKey, ...field);
                const result = {};

                for (let i = 0; i < field.length; i++) {
                    if (values[i] !== null) {
                        result[field[i]] = await this.deserialize(values[i]);
                    }
                }

                return result;
            } else {
                
                const value = await this.redis.hget(fullKey, field);
                return value !== null ? await this.deserialize(value) : null;
            }

        } catch (error) {
            return field === null ? {} : null;
        }
    }

    
    async cacheAside(key, loader, options = {}) {
        const {
            namespace = null,
            ttl = this.config.defaultTTL.shortTerm,
            stale = false           
        } = options;

        
        const cached = await this.get(key, { namespace });
        if (cached !== null) {
            return cached;
        }

        
        if (this.config.stampede.enabled) {
            return await this.loadWithLock(key, loader, { namespace, ttl, stale });
        }

        
        const data = await loader();
        if (data !== undefined) {
            await this.set(key, data, { namespace, ttl });
        }

        return data;
    }

    
    async writeThrough(key, value, writer, options = {}) {
        const {
            namespace = null,
            ttl = this.config.defaultTTL.shortTerm
        } = options;

        try {
            
            await writer(value);

            
            await this.set(key, value, { namespace, ttl });

            return true;

        } catch (error) {
            
            this.logger.error({
                action: 'write_through_error',
                key,
                error: error.message
            }, 'Write-through error');

            return false;
        }
    }

    
    async refreshAhead(key, loader, options = {}) {
        const {
            namespace = null,
            ttl = this.config.defaultTTL.shortTerm,
            refreshRatio = 0.5      
        } = options;

        const fullKey = this.buildKey(key, namespace);

        
        const data = await loader();
        if (data === undefined) {
            return;
        }

        
        await this.set(key, data, { namespace, ttl });

        
        const refreshIn = ttl * refreshRatio * 1000;

        
        if (this.refreshTimers.has(fullKey)) {
            clearTimeout(this.refreshTimers.get(fullKey));
        }

        
        const timer = setTimeout(async () => {
            try {
                await this.refreshAhead(key, loader, options);
            } catch (error) {
                this.logger.error({
                    action: 'refresh_ahead_error',
                    key,
                    error: error.message
                }, 'Refresh-ahead error');
            }
        }, refreshIn);

        this.refreshTimers.set(fullKey, timer);
    }

    
    async flush(options = {}) {
        const {
            namespace = null,
            pattern = null,
            confirm = false
        } = options;

        if (!confirm) {
            throw new Error('Flush must be confirmed with confirm: true');
        }

        try {
            if (pattern || namespace) {
                
                const searchPattern = pattern ||
                    this.buildKey('*', namespace);
                const keys = await this.redis.keys(searchPattern);

                if (keys.length > 0) {
                    await this.redis.del(...keys);
                }

                this.logger.warn({
                    action: 'cache_flush_pattern',
                    pattern: searchPattern,
                    deleted: keys.length
                }, 'Cache flushed by pattern');

                return true;
            } else {
                
                if (process.env.NODE_ENV === 'production') {
                    throw new Error('Full flush not allowed in production');
                }

                await this.redis.flushdb();

                this.logger.warn({
                    action: 'cache_flush_all'
                }, 'Cache fully flushed');

                return true;
            }

        } catch (error) {
            this.logger.error({
                action: 'cache_flush_error',
                error: error.message
            }, 'Cache flush error');

            return false;
        }
    }

    
    async getStats() {
        const info = await this.redis.info('stats');
        const dbSize = await this.redis.dbsize();

        
        const stats = {};
        info.split('\r\n').forEach(line => {
            const [key, value] = line.split(':');
            if (key && value) {
                stats[key] = value;
            }
        });

        return {
            
            app: {
                hits: this.stats.hits,
                misses: this.stats.misses,
                hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
                sets: this.stats.sets,
                deletes: this.stats.deletes,
                errors: this.stats.errors
            },

            
            redis: {
                keys: dbSize,
                memory: stats.used_memory_human,
                hits: parseInt(stats.keyspace_hits || 0),
                misses: parseInt(stats.keyspace_misses || 0),
                evictedKeys: parseInt(stats.evicted_keys || 0),
                connectedClients: parseInt(stats.connected_clients || 0)
            }
        };
    }

    

    
    buildKey(key, namespace = null) {
        const parts = [this.config.keyPrefix.replace(/:$/, '')];

        if (namespace) {
            parts.push(namespace);
        }

        parts.push(key);

        return parts.join(':');
    }

    
    async serialize(value, options = {}) {
        if (value === null || value === undefined) {
            return null;
        }

        let serialized;
        const type = typeof value;

        
        if (type === 'string') {
            serialized = value;
        } else if (type === 'number' || type === 'boolean') {
            serialized = String(value);
        } else if (Buffer.isBuffer(value)) {
            serialized = value.toString('base64');
        } else {
            
            serialized = JSON.stringify(value);
        }

        
        if (this.shouldCompress(serialized, type, options)) {
            const zlib = require('zlib');
            const compressed = zlib.gzipSync(serialized);
            return `gzip:${compressed.toString('base64')}`;
        }

        return serialized;
    }

    
    async deserialize(value, options = {}) {
        if (!value) return null;

        
        if (value.startsWith('gzip:')) {
            const zlib = require('zlib');
            const compressed = Buffer.from(value.slice(5), 'base64');
            value = zlib.gunzipSync(compressed).toString();
        }

        
        if (options.parse !== false) {
            try {
                return JSON.parse(value);
            } catch (e) {
                
            }
        }

        
        if (/^-?\d+(\.\d+)?$/.test(value)) {
            const num = Number(value);
            if (!isNaN(num)) {
                return num;
            }
        }

        
        if (value === 'true') return true;
        if (value === 'false') return false;

        return value;
    }

    
    shouldCompress(value, type, options) {
        if (options.compress !== null) {
            return options.compress;
        }

        if (!this.config.serialization.compress) {
            return false;
        }

        const typeConfig = this.config.types[type];
        if (typeConfig && !typeConfig.compress) {
            return false;
        }

        return value.length > this.config.serialization.compressionThreshold;
    }

    
    async loadWithLock(key, loader, options) {
        const fullKey = this.buildKey(key, options.namespace);
        const lockKey = `${fullKey}:lock`;
        const staleKey = `${fullKey}:stale`;

        
        const lockAcquired = await this.redis.set(
            lockKey,
            '1',
            'PX',
            this.config.stampede.lockTimeout,
            'NX'
        );

        if (lockAcquired) {
            
            try {
                const data = await loader();

                if (data !== undefined) {
                    
                    await this.set(key, data, options);

                    
                    if (options.stale) {
                        await this.set(
                            `${key}:stale`,
                            data,
                            {
                                namespace: options.namespace,
                                ttl: this.config.stampede.staleTimeout / 1000
                            }
                        );
                    }
                }

                return data;

            } finally {
                
                await this.redis.del(lockKey);
            }
        } else {
            
            if (options.stale) {
                const staleData = await this.get(`${key}:stale`, {
                    namespace: options.namespace
                });

                if (staleData !== null) {
                    return staleData;
                }
            }

            
            await this.waitForLock(lockKey);

            
            return await this.get(key, { namespace: options.namespace });
        }
    }

    
    async waitForLock(lockKey, maxWait = 5000) {
        const start = Date.now();
        const checkInterval = 50;

        while (Date.now() - start < maxWait) {
            const exists = await this.redis.exists(lockKey);
            if (!exists) {
                return;
            }

            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }

        throw new Error('Lock wait timeout');
    }

    
    async loadThrough(key, loader, options) {
        const fullKey = this.buildKey(key, options.namespace);

        
        if (typeof loader === 'function') {
            this.loaders.set(fullKey, loader);
        }

        
        const loaderFn = this.loaders.get(fullKey) || loader;
        if (!loaderFn) {
            return null;
        }

        const data = await loaderFn();

        if (data !== undefined) {
            const ttl = options.ttl || this.config.defaultTTL.shortTerm;
            await this.set(key, data, { namespace: options.namespace, ttl });
        }

        return data;
    }

    
    async addTags(key, tags) {
        for (const tag of tags) {
            const tagKey = this.buildKey(`tag:${tag}`, 'meta');
            await this.redis.sadd(tagKey, key);

            
            await this.redis.expire(tagKey, this.config.defaultTTL.longTerm);
        }
    }

    
    recordHit() {
        if (this.shouldRecordStats()) {
            this.stats.hits++;
        }
    }

    recordMiss() {
        if (this.shouldRecordStats()) {
            this.stats.misses++;
        }
    }

    recordSet(count = 1) {
        if (this.shouldRecordStats()) {
            this.stats.sets += count;
        }
    }

    recordDelete(count = 1) {
        if (this.shouldRecordStats()) {
            this.stats.deletes += count;
        }
    }

    recordError() {
        this.stats.errors++;
    }

    shouldRecordStats() {
        return this.config.stats.enabled &&
            Math.random() < this.config.stats.sampleRate;
    }

    
    cleanup() {
        
        for (const timer of this.refreshTimers.values()) {
            clearTimeout(timer);
        }
        this.refreshTimers.clear();

        
        this.loaders.clear();
    }
}

module.exports = CacheService;