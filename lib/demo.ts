export type View = 'today' | 'content' | 'inbox' | 'ai' | 'more' | 'approvals' | 'analytics' | 'brand' | 'connections' | 'team' | 'billing';
export type Post = { id: number; title: string; text: string; channel: string; format: string; date: string; time: string; status: 'review' | 'draft' | 'approved'; image: boolean };
export const initialPosts: Post[] = [
 { id:1, title:'Утро начинается не с будильника', text:'А с аромата свежего кофе. Медленное утро, хрустящий круассан и ваш любимый капучино — иногда для счастья нужно совсем немного.\n\nЗагляните в June за своим маленьким утренним ритуалом. Ждём вас в Ташкенте.\n\n#junecoffee #кофеташкент #утровjune',channel:'Instagram',format:'Пост',date:'2026-10-23',time:'10:00',status:'review',image:true},
 { id:2, title:'Ваш кофе. Ваш маленький ритуал.',text:'Какой кофе выбираете вы? Расскажите в комментариях о своём любимом утреннем ритуале.',channel:'Instagram',format:'Reels · сценарий',date:'2026-10-23',time:'16:00',status:'review',image:true},
 { id:3, title:'За кадром: знакомьтесь, наш бариста',text:'За каждой чашкой — человек, который любит своё дело. Сегодня знакомимся с командой June.',channel:'Telegram',format:'Пост',date:'2026-10-24',time:'12:00',status:'review',image:false},
 { id:4, title:'Три способа сделать утро вкуснее',text:'Не торопитесь. Выберите любимый столик. Закажите что-то новое. А мы позаботимся о кофе.',channel:'Instagram',format:'Карусель',date:'2026-10-25',time:'09:00',status:'draft',image:true},
 { id:5, title:'Почему мы выбираем specialty',text:'От фермы до вашей чашки: рассказываем, как выбираем зерно и почему это важно.',channel:'Telegram',format:'Пост',date:'2026-10-26',time:'11:00',status:'draft',image:false}
];
export const viewTitles: Record<View,string> = {today:'Сегодня',content:'Контент',inbox:'Входящие',ai:'AI-ассистент',more:'Ещё',approvals:'Согласования',analytics:'Аналитика',brand:'Память бренда',connections:'Подключения',team:'Команда',billing:'Тариф и оплата'};
export const statusLabels = {review:'На согласовании',draft:'Черновик',approved:'Согласовано'};
