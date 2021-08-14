import {createRouter,createWebHashHistory} from 'vue-router'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [{
            path: "/home",
            name: "home",
            component: () => import( "@/views/Home.vue"),
        },{
            path: "/",
            name: "login",
            component: () => import( "@/views/Login.vue"),
        },
    ]
})

export default router;

