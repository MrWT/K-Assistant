<script setup>
    import { ref, reactive, onMounted, onUpdated, watch, nextTick } from 'vue'
    import moment from 'moment'
    import { fetchData } from "@/composables/fetchData"

    const emit = defineEmits(['popupMessage']);
    const props = defineProps({
        title: String,
        account: String,
        user_role: String,
    })

    onMounted(() => {
        console.log("imagen mounted.");
        init();
    });

    onUpdated(() => {
        console.log("imagen updated.");

    });

    let appState = ref("");
    
    let promptOptions = reactive({
        scene: [],
        specifyView: [],
        paintStyle: [],
        gen_limit: 0,
        gen_image_count: 0,
    });

    let setPrompt = reactive({
        text: "",
        scene: "日常問候",
        sceneOther: "",
        specifyView: "無",
        specifyViewOther: "",
        paintStyle: "無",
        paintStyleOther: "",
    });

    let promptImg = reactive({
        state: "INIT",
        prompt: "",
        src: "",
    });

    // 初始化 component
    function init(){
        console.log("imagen.init");
        console.log("imagen.props.title", props.title);
        console.log("imagen.props.account", props.account);
        console.log("imagen.props.user_role", props.user_role);

        fetchInitData();
        combinePrompt();
    }
    // 取得初始資料
    function fetchInitData(){
        // get_imagen_option

        let fetchPromise_imageOption = fetchData({
            api: "get_imagen_option",
        });
        let fetchPromise_genImageCount = fetchData({
            api: "get_imagen_count",
            data: {
                account: props.account,
            }
        });
        Promise.all([fetchPromise_imageOption, fetchPromise_genImageCount]).then((values) => {
            console.log("fetchInitData.values=", values);

            promptOptions.scene = values[0].scene.split(",");
            promptOptions.specifyView = values[0].specify_view.split(",");
            promptOptions.paintStyle = values[0].paint_style.split(",");
            promptOptions.gen_limit = parseInt( values[0].gen_limit );

            promptOptions.gen_image_count = parseInt( values[1] );
        });
    }
    // 開始生成圖片
    function makePromptImg(){
        promptImg.prompt += ". 在圖片中只能出現英文!";
        console.log("makePromptImg.prompt=" + promptImg.prompt);

        // 增加 gen_image_count
        promptOptions.gen_image_count += 1;

        let promptImgPromise = fetchData({
            api: "ai_gen_image",
            data: {
                prompt: promptImg.prompt,
                word: setPrompt.text,
                account: props.account,
                gen_image_count: promptOptions.gen_image_count,
            }
        }, "AI");
        Promise.all([promptImgPromise]).then((values) => {
            console.log("promptImgPromise.values=", values);

            if(values[0].startsWith("ERROR")){
                emit('popupMessage', false, "AI 發生錯誤, 請稍後再試試~~"); // Emitting the event with data
            }else{
                promptImg.src = values[0];

                openImageModal();

                /*
                {
                    let image = new Image(60, 45); 
                    image.onload = drawImageActualSize; 
                    image.src = promptImg.src;
                }
                */
            }

            // 紀錄 log
            newLog("N");
        });
    }
    // 複製, 到 Gemini 等工具貼上
    function copyPrompt(){
        copyTextToClipboard(promptImg.prompt);
        // 紀錄 log
        newLog("N");
    }
    // 實際複製到 clipboard
    async function copyTextToClipboard(textToCopy) {
        try {
            await navigator.clipboard.writeText(textToCopy);
            console.log('已成功複製到剪貼簿, textToCopy=', textToCopy);
        } catch (err) {
            console.error('無法複製文字：', err);
        }
    }
    /*
    // 在 canvas 畫出 image / 文字
    function drawImageActualSize() {
        let canvas = document.getElementById("canvas");
        let ctx = canvas.getContext("2d");

        canvas.width = this.naturalWidth;
        canvas.height = this.naturalHeight;

        ctx.drawImage(this, 0, 0);

        // 畫上文字
        if(setPrompt.text)
        {
            let centerX = canvas.width / 2;
            let centerY = canvas.height / 2;

            ctx.font = '100px Arial';
            ctx.fillStyle = 'white';

            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            ctx.strokeText("setPrompt.text", centerX, centerY);
        }
    }
    */
    // 開啟 image modal
    function openImageModal(){
        document.getElementById("imageModal").showModal();
    }
    // 關閉 setting modal
    function closeImageModal(){
        document.getElementById("imageModal").close();
    }
    // 組合 prompt
    function combinePrompt(){
        let prompt = "";

        prompt += "幫我生成一張圖片";
        // scene
        switch(setPrompt.scene){
            case "其他":
                if(setPrompt.sceneOther){
                    prompt += ", 這張圖片要使用在'" + setPrompt.sceneOther + "' ";
                }else{
                    prompt += ", 這張圖片要使用在'日常問候' ";
                }                
                break;
            default:
                prompt += ", 這張圖片要使用在'" + setPrompt.scene + "' ";
                break;
        }
        // specify view
        switch(setPrompt.specifyView){
            case "無":
                break;
            case "其他":
                if(setPrompt.specifyViewOther){
                    prompt += ", 圖片背景為'" + setPrompt.specifyViewOther + "' ";
                }
                break;
            default:
                prompt += ", 圖片背景為'" + setPrompt.specifyView + "' ";
                break;
        }
        // paint style
        switch(setPrompt.paintStyle){
            case "無": 
                break;
            case "其他":
                if(setPrompt.paintStyleOther){
                    prompt += ", 以'" + setPrompt.paintStyleOther + "'方式呈現出圖片";
                }
                break;
            default:
                prompt += ", 以'" + setPrompt.paintStyle + "'方式呈現出圖片";
                break;
        }
        promptImg.prompt = prompt;
    }
    // 下載圖片
    function downloadImage(){
        let a = document.createElement("a"); //Create <a>
        a.href = promptImg.src; //Image Base64 Goes here
        a.download = "長輩圖_" + moment().format("YYYYMMDD_HHmmss") + ".png"; //File name Here
        a.click(); //Downloaded file

        newLog("Y");
    }
    // 新增 log
    function newLog(is_download){
        let fetchPromise_newLog = fetchData({
            api: "new_log",
            data:{
                function: "imagen",
                account: props.account,
                prompt: promptImg.prompt,
                image: "", //promptImg.src,
                is_download: is_download
            }
        });
        Promise.all([fetchPromise_newLog]).then((values) => {
            console.log("fetchPromise_newLog.values=", values);
        });
    }

</script>

<template>

<div class="w-1/1 h-1/1 flex flex-col gap-2">
    <div class="w-1/1 flex flex-row items-center">
        <span class="flex-none bg-stone-400/50 text-start p-2 rounded-ss-xl rounded-es-xl">
            適用情境:
        </span>
        <select class="select flex-1 rounded-none rounded-se-xl rounded-ee-xl" v-model="setPrompt.scene" @change="combinePrompt">
            <option v-for="(option, option_i) in promptOptions.scene" :value="option">{{ option }}</option>
        </select>
        <input v-if="setPrompt.scene === '其他'" type="text" placeholder="e.g., 情人節" class="input flex-1 rounded-none rounded-se-xl rounded-ee-xl" v-model="setPrompt.sceneOther" @keyup.stop="combinePrompt" />    
    </div>
    <div class="w-1/1 flex flex-row items-center">
        <span class="flex-none bg-stone-400/50 p-2 text-start rounded-ss-xl rounded-es-xl">
            指定景色:
        </span>
        <select class="select flex-1 rounded-none rounded-se-xl rounded-ee-xl" v-model="setPrompt.specifyView" @change="combinePrompt">
            <option v-for="(option, option_i) in promptOptions.specifyView" :value="option">{{ option }}</option>
        </select>
        <input v-if="setPrompt.specifyView === '其他'" type="text" placeholder="e.g., 正統鹿耳門聖母廟" class="input flex-1 rounded-none rounded-se-xl rounded-ee-xl" v-model="setPrompt.specifyViewOther" @keyup.stop="combinePrompt" />    
    </div>
    <div class="w-1/1 flex flex-row items-center">
        <span class="flex-none bg-stone-400/50 p-2 text-start rounded-ss-xl rounded-es-xl">
            指定畫風:
        </span>
        <select class="select flex-1 rounded-none rounded-se-xl rounded-ee-xl" v-model="setPrompt.paintStyle" @change="combinePrompt">
            <option v-for="(option, option_i) in promptOptions.paintStyle" :value="option">{{ option }}</option>
        </select>
        <input v-if="setPrompt.paintStyle === '其他'" type="text" placeholder="e.g., 仿鬼滅之刃風格" class="input flex-1 rounded-none rounded-se-xl rounded-ee-xl" v-model="setPrompt.paintStyleOther" @keyup.stop="combinePrompt" />
    </div>
    <div class="w-1/1 flex flex-col">
        <span class="w-1/1 bg-stone-400/50 p-2 text-start rounded-ss-xl rounded-se-xl">
            畫中題字<br />(圖中只會呈現英文! 若打入中文, 會先翻譯成英文後, 再呈現在圖片上!):
        </span>
        <div class="w-1/1">
            <input type="text" placeholder="e.g., Good Morning" class="input w-1/1 rounded-none rounded-es-xl rounded-ee-xl" v-model="setPrompt.text" @keyup.stop="combinePrompt" />
        </div>
    </div>

    <div class="w-1/1 flex flex-col">
        <span class="w-1/1 bg-stone-900/50 text-gray-100 p-2 text-center rounded-ss-xl rounded-se-xl">
            給予 AI 的話:
        </span>
        <div class="w-1/1 h-fit">
            <textarea class="border rounded-xl textarea w-1/1 h-1/1 cursor-default text-gray-900" v-model="promptImg.prompt"></textarea>                
        </div>
    </div>
    
    <div class="divider divider-primary"></div>
    <div class="w-1/1 flex justify-center">
        <div v-if="promptOptions.gen_image_count < promptOptions.gen_limit" class="w-1/2">
            <button class="btn btn-square bg-black text-white w-1/1" @click.prevent="makePromptImg">
                生成
            </button>
        </div>
        <div v-if="promptOptions.gen_image_count >= promptOptions.gen_limit" class="w-1/2">
            <button class="btn btn-square bg-black text-white w-1/1" @click.prevent="copyPrompt">
                複製, 到 AI 等工具貼上
            </button>
        </div>
    </div>
</div>

<!-- image modal -->
<dialog id="imageModal" class="modal">
    <div class="modal-box h-7/10 w-8/10 flex flex-col bg-neutral-100">
        <div class="flex flex-col justify-center">
            <span class="text-xl text-gray-900 text-center"></span>
            <div class="divider divider-primary"></div>
        </div>
        <div class="h-1/1 w-1/1 flex flex-col overflow-auto">
            <!---->
            <img :src="promptImg.src" />
            <!---->
            <!--
            <canvas id="canvas"></canvas>
            -->
        </div>
        <div class="divider divider-primary"></div>
        <div class="modal-action">
            <button class="btn btn-ghost w-1/2 bg-gray-200 text-gray-900 hover:bg-yellow-100" @click="closeImageModal">
                <svg class="size-8" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
                </svg>
                關閉預覽
            </button>

            <button class="btn btn-ghost w-1/2 bg-gray-200 text-gray-900 hover:bg-yellow-100" @click="downloadImage">
                <svg class="size-8" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V4M7 14H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2m-1-5-4 5-4-5m9 8h.01"/>
                </svg>
                下載圖片
            </button>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>


</template>

<style scoped>

</style>
