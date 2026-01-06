<script setup>
    import { ref, reactive, onMounted } from 'vue'
    
    const emit = defineEmits(['introduceAuthor']);
    const props = defineProps({
        title: String,
        reference: Array,
    })

    onMounted(() => {
        console.log("Readme mounted.");
        init();
    });

    let appState = ref("");
    let screenSize = ref("md");

    // 初始化 component
    function init(){
        console.log("props.title=", props.title);
        console.log("props.reference=", props.reference);

        // w-sm 約等於 384px
        // w-md 約等於 448px
        //console.log("window.innerWidth=" + window.innerWidth);
        if(window.innerWidth > 448){
            screenSize.value = "md";
        }else if(304 < window.innerWidth && window.innerWidth < 448 ){
            screenSize.value = "sm";
        }else{
            screenSize.value = "xs";
        }

    }

    // 驅動 parent component 前往 author.js component
    function gotoIntroduceAuthor(){
        emit('introduceAuthor', 'author'); // Emitting the event with data
    }

</script>

<template>

    <div class="w-1/1 h-1/1 overflow-y-auto">
        <div class="w-1/1 flex flex-col p-2 bg-blue-900 text-3xl text-center text-white font-blak rounded-xl sticky top-0 z-[50]">
            <span>K-Assistant</span>
            <span>您的資料管理助理</span>
        </div>
        <div class="divider divider-primary"></div>

        <div class="w-1/1 h-fit p-2 text-2xl text-center text-black bg-yellow-300/50 rounded-ss-xl rounded-se-xl">
            系統架構
        </div>
        <div class="flex flex-col w-1/1 h-fit justify-center">
            <div class="divider">Frontend</div>

            <div class="w-1/1 flex flex-wrap gap-1 justify-center">
                <div class="card bg-base-300 rounded-box w-1/1 max-w-100 p-1">
                    <div class="w-1/1 h-1/1 p-1">
                        <div class="text-2xl underline text-center mb-2 p-1 bg-gray-800 text-gray-200 rounded-ss-xl rounded-se-xl">
                            github.io
                        </div>

                        <div class="flex flex-wrap gap-1 justify-center">
                            <div class="p-2 justify-center content-center rounded-4xl w-fit text-base bg-green-200">DaisyUI</div>
                            <div class="p-2 justify-center content-center rounded-4xl w-fit text-xl bg-teal-300">TailwindCSS</div>
                            <div class="p-2 justify-center content-center rounded-4xl w-fit text-lg bg-yellow-300/50">gsap.js</div>
                            <div class="py-2 px-1 justify-center content-center rounded-4xl w-fit text-sm bg-blue-100">ApexChart</div>
                            <div class="p-2 justify-center content-center rounded-4xl w-fit text-2xl bg-red-300">Vue3</div>
                            <div class="p-2 justify-center content-center rounded-4xl w-fit text-xl bg-orange-200">Vite</div>
                        </div>
                    </div>
                </div>

                <div class="card bg-base-300 rounded-box w-1/1 max-w-100 p-1">
                    <div class="w-1/1 h-1/1 p-1">
                        <div class="text-2xl underline text-center mb-2 p-1 bg-gray-800 text-gray-200 rounded-ss-xl rounded-se-xl">
                            Line App
                        </div>

                        <div class="flex flex-wrap gap-1 justify-center">
                            <div class="p-2 justify-center content-center rounded-4xl w-fit text-2xl bg-gray-300">Messaging API</div>
                            <div class="p-2 justify-center content-center rounded-4xl w-fit text-2xl bg-zinc-300">Rich Menu</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="divider">Backend</div>
            <div class="w-1/1 flex flex-wrap gap-1 justify-center p-1">
                <div class="card bg-base-300 p-1 max-w-100">
                    <div class="w-1/1 h-1/1 p-1">
                        <div class="text-2xl underline text-center mb-2 p-1 bg-gray-800 text-gray-200 rounded-ss-xl rounded-se-xl">
                            Web API
                        </div>

                        <div class="flex flex-wrap gap-1 justify-center">
                            <div class="p-2 justify-center content-center rounded-4xl w-fit text-2xl bg-gray-300">Cloud Run( Python )</div>
                        </div>
                    </div>
                </div>

                <div class="card bg-base-300 p-1 max-w-50">
                    <div class="w-1/1 h-1/1 p-1">
                        <div class="text-2xl underline text-center mb-2 p-1 bg-gray-800 text-gray-200 rounded-ss-xl rounded-se-xl">
                            Database
                        </div>

                        <div class="flex flex-wrap gap-1 justify-center">
                            <div class="p-2 justify-center content-center rounded-4xl w-fit text-2xl bg-gray-300">Firestore</div>
                        </div>
                    </div>
                </div>

                <div class="card bg-base-300 flex flex-col p-1 max-w-100">
                    <div class="w-1/1 h-1/1 p-1">
                        <div class="text-2xl underline text-center mb-2 p-1 bg-gray-800 text-gray-200 rounded-ss-xl rounded-se-xl">
                            Vertex AI
                        </div>

                        <div class="flex flex-wrap gap-1 justify-center">
                            <div class="p-2 justify-center content-center rounded-4xl w-fit text-2xl bg-indigo-300">gemini-3-flash-preview</div>
                            <div class="p-2 justify-center content-center rounded-4xl w-fit text-2xl bg-fuchsia-300">gemini-3-pro-image-preview</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="divider"></div>
        <div class="w-1/1 h-fit p-2 text-2xl text-center text-black bg-yellow-300/50 rounded-ss-xl rounded-se-xl">
            實作技術參考
        </div>
        <ul class="list bg-base-100 rounded-box h-fit w-10/10 overflow-y-auto shadow-2xl">
            <li v-for="resObj in props.reference" class="list-row hover:bg-yellow-300/10" 
                    :class="{'bg-gray-200': resObj.arch === 'frontend', 'bg-gray-300': resObj.arch === 'backend'}">
                <div class="text-4xl font-thin opacity-30 tabular-nums">{{ resObj.index }}</div>
                <div class="list-col-grow">
                    <div>{{ resObj.text }}</div>
                    <div class="text-xs lowercase font-semibold opacity-60">{{ resObj.link }}</div>
                </div>
                <button class="btn btn-square btn-ghost">
                    <a :href="resObj.link" target="_blank">
                        <svg class="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor"><path d="M6 3L20 12 6 21 6 3z"></path></g></svg>
                    </a>
                </button>
            </li>
        </ul>

        <div class="divider"></div>
        <div class="w-10/10 text-center">
            <a class="cursor-pointer underline text-2xl" @click="gotoIntroduceAuthor">作者簡介</a>
        </div>

        <div class="divider"></div>

    </div>

</template>

<style scoped>

</style>
