<script setup>
    import { ref, reactive, onMounted } from 'vue'
    import moment from 'moment'
    import { fetchData } from "@/composables/fetchData"

    const emit = defineEmits(['popupMessage']);
    const props = defineProps({
        app_state: String,
        title: String,
        account: String,
        user_role: String, 
    })

    onMounted(() => {
        console.log("Setting_Activity mounted.");
        init();
    });

    let uploadedFileName = ref("");
    let manual = reactive({
        location_name: "",
        page: "",
        memo: "",
    });    
    let locations = reactive([]);

    // 初始化 component
    function init(){
        //console.log("Setting_Activity.init");
        //console.log("props.app_state", props.app_state);
        //console.log("props.title", props.title);
        //console.log("props.account", props.account);
        //console.log("props.user_role", props.user_role);

        fetchActivity();
    }
    // 取得活動清單
    function fetchActivity(){
        let getActivityPromise = fetchData({
            api: "get_activiy",
            data: {
                activity_month: "ALL",
                user_role: props.user_role,
            }
        }, "KUO-FUNDS");
        Promise.all([getActivityPromise]).then((values) => {
            console.log("getActivityPromise.values=", values);

            locations.splice(0, locations.length);
            values[0].forEach((activity, act_i) => {
                locations.push( activity["location_name"] );
            });
        });
    }
    // 觸發上傳檔案
    function triggerUploadFile(){
        document.getElementById("fileInput").click();
    }
    // 轉換圖檔成 base64
    function change_image_to_base64(event){
        const file = event.target.files[0];
        uploadedFileName.value = file.name;
        console.log("change_image_to_base64.file=", uploadedFileName.value);

        if (file) {
            const reader = new FileReader();

            reader.onloadend = () => {
                console.log("Base64 encoded string:", reader.result);
                // The reader.result will be a data URL like:
                // "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..."

                manual.page = reader.result;
            };

            reader.onerror = (error) => {
                console.error("Error reading file:", error);
            };

            reader.readAsDataURL(file);
        } else {
            console.log("No file selected.");
        }
    }
    // 新增活動手冊頁面
    function new_manual_page(){
        console.log("new_manual_page.manual=", manual);

        if(!manual.location_name){
            // 將 message 傳給 Setting.vue 
            emit('popupMessage', false, "請輸入活動地點!"); // Emitting the event with data
            return;
        }
        if(!manual.page){
            // 將 message 傳給 Setting.vue 
            emit('popupMessage', false, "請選擇活動手冊頁面!"); // Emitting the event with data
            return;
        }

        let newManualPagePromise = fetchData({
            api: "new_activity_manual_page",
            data: {
                manual: manual,
            }
        }, "KUO-FUNDS");
        Promise.all([newManualPagePromise]).then((values) => {
            console.log("newManualPagePromise.values=", values);

            opObj.status = values[0]["result"];
            if(values[0]["result"] === true){
                opObj.message = "儲存成功";
            }else{
                opObj.message = values[0]["message"];
            }

            // 將 message 傳給 Setting.vue 
            emit('popupMessage', opObj.status, opObj.message); // Emitting the event with data
        });
        
    }
</script>

<template>

    <div class="divider">新增活動說明頁面</div>
    <div class="w-10/10 flex flex-col md:flex-row gap-2 place-items-center">
        <div class="w-10/10 md:w-5/10 flex flex-col">
            <label class="label">
                地點:
                <input type="text" class="input w-10/10" placeholder="" v-model="manual.location_name" list="locations" />
                <datalist id="locations">
                    <option v-for="(location, l_i) in locations" :value="location"></option>
                </datalist>
            </label>
        </div>

        <div class="w-10/10 md:w-5/10 flex flex-col">
            <label class="label">
                圖檔:
                <input type="file" class="hidden" id="fileInput" accept="image/png, image/jpeg" @change="change_image_to_base64" />
                <button class="btn btn-primary" title="只接受 .png, .jpg" @click="triggerUploadFile">上傳檔案</button>
                <span>{{ uploadedFileName }}</span>
            </label>
        </div>
    </div>
    <div class="w-10/10 flex flex-col md:flex-row gap-2 mt-2 place-items-center">
        <div class="w-10/10 md:w-5/10 flex flex-col">
            <label class="label">
                備註:
                <input type="text" class="input w-10/10" placeholder="" v-model="manual.memo" />
            </label>
        </div>
        <button class="btn btn-neutral w-10/10 md:w-5/10" @click="new_manual_page">
            NEW
        </button>
    </div>
   
    

</template>

<style scoped>

</style>
