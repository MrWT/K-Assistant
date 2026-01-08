<script setup>
    import { ref, reactive, onMounted } from 'vue'
    import moment from 'moment'
    import { fetchData } from "@/composables/fetchData"

    const emit = defineEmits(['modalStatus']);
    const props = defineProps({
        account: String,
    })

    onMounted(() => {
        console.log("SettingPersonal mounted.");
        init();
    });

    let userObj = reactive({
        account: "",
        name: "",
        mail: "",
        app_title: "",
        language: "",
        role: "",
        ai_role: {},
    });

    let aiRoleObj = reactive({
        nation: "TAIWAN",
        gender: "GIRL",
    });

    // 初始化 component
    function init(){
        console.log("SettingPersonal.init");
        console.log("props.account=" + props.account);

        // 取得使用者個人資料
        fetchUser();
    }    
    // 取得使用者個人資料
    function fetchUser(){
        let fetchUserPromise = fetchData({
            api: "get_user",
            data: {
                account: props.account,
            }
        });
        Promise.all([fetchUserPromise]).then((values) => {
            console.log("fetchUserPromise.values=", values);

            userObj["account"] = props.account;
            if(values.length > 0){
                userObj["name"] = values[0].name;
                userObj["mail"] = values[0].mail;
                userObj["app_title"] = values[0].app_title;
                userObj["language"] = values[0].language;
                userObj["role"] = values[0].role;
                userObj["ai_role"] = values[0].ai_role;
            }
        });
    }
    // 儲存資料
    function saveData(){
        console.log("saveData.userObj=", userObj);

        let savePromise_user = fetchData({
            api: "save_users",
            data: userObj
        });
        Promise.all([savePromise_user]).then((values) => {
            console.log("savePromise_user.values=", values);

            if(values[0]["result"] === true){
                // 將 message 傳給 App.vue 
                emit('modalStatus', "SAVE_SUCCESS", "儲存成功( 重新登入後, UI 上的個人資料才會換新 )"); // Emitting the event with data
            }else{
                // 將 message 傳給 App.vue 
                emit('modalStatus', "SAVE_FAIL", values[0]["message"]); // Emitting the event with data
            }
        });
    }
    // 跟 parent 說, 把我關閉
    function closeModal(){
        // 將 message 傳給 App.vue 
        emit('modalStatus', "CLOSE", ""); // Emitting the event with data
    }
</script>

<template>
    <div class="divider divider-primary">
        個人資料設定
    </div>
    <div class="w-1/1 flex flex-col gap-2 p-2">
        <div class="w-1/1 flex flex-row items-center gap-2">
            <span class="flex-none">姓名:</span>
            <input type="text" class="input flex-1 border rounded-xl px-2" v-model="userObj.name" />
        </div>

        <div class="w-1/1 flex flex-row items-center gap-2">
            <span class="flex-none">Mail:</span>
            <input type="text" class="input flex-1 border rounded-xl px-2" v-model="userObj.mail" />
        </div>

        <div class="w-1/1 flex flex-row items-center gap-2">
            <span class="flex-none">App 名稱:</span>
            <input type="text" class="input flex-1 border rounded-xl px-2" v-model="userObj.app_title" />
        </div>

        <div class="w-1/1 flex flex-row items-center gap-2">
            <span class="flex-none">慣用語言:</span>
            <div class=" flex-1 flex flex-row gap-2">
                <label class="label text-gray-900 ">
                    <input type="radio" class="radio radio-primary" value="KOREA" v-model="userObj.language" />
                    繁體中文 
                </label>
                <label class="label text-gray-900">
                    <input type="radio" class="radio radio-primary" value="JAPAN" v-model="userObj.language" />
                    英文
                </label>
            </div>
        </div>
    </div>
    <div class="divider divider-primary">
        AI 資料設定
    </div>
    <div class="w-1/1 flex flex-col gap-2 p-2">
        <div class="w-1/1 flex flex-row items-center gap-2">
            <span class="flex-none">姓名:</span>
            <input type="text" class="input flex-1 border rounded-xl px-2" v-model="userObj.ai_role.name" />
        </div>
        <div class="w-1/1 flex flex-row items-center gap-2">
            <span class="flex-none">Logo 名:</span>
            <input type="text" class="input flex-1 border rounded-xl px-2" v-model="userObj.ai_role.short_name" />
        </div>
        <div class="w-1/1 flex flex-row items-center gap-2">
            <span class="flex-none">國家:</span>
            <div class="flex-1 flex flex-row justify-left gap-2">            
                <label class="label text-gray-900 ">
                    <input type="radio" class="radio radio-primary" value="KOREA" v-model="userObj.ai_role.nation" />
                    韓國 
                </label>
                <label class="label text-gray-900">
                    <input type="radio" class="radio radio-primary" value="JAPAN" v-model="userObj.ai_role.nation" />
                    日本
                </label>
                <label class="label text-gray-900">
                    <input type="radio" class="radio radio-primary" value="TAIWAN" v-model="userObj.ai_role.nation" />
                    台灣
                </label>
            </div>
        </div>
        <div class="w-1/1 flex flex-row items-center gap-2">
            <span class="flex-none">性別:</span>
            <div class="flex-1 flex flex-row justify-left gap-2">
                <label class="label text-gray-900">
                    <input type="radio" class="radio radio-secondary" value="BOY" v-model="userObj.ai_role.gender" />
                    Boy
                </label>
                <label class="label text-gray-900">
                    <input type="radio" class="radio radio-secondary" value="GIRL" v-model="userObj.ai_role.gender" />
                    Girl
                </label>
            </div>
        </div>
    </div>

    <div class="divider divider-primary"></div>
    <div class="w-1/1 flex flex-row gap-2 px-10">
        <button class="btn bg-gray-900 text-gray-100 hover:bg-yellow-200 hover:text-gray-900 w-1/2" @click="closeModal">
            關閉
        </button>
        <button class="btn bg-gray-200 text-gray-900 w-1/2 hover:bg-yellow-200" @click="saveData">
            儲存
        </button>
    </div>

</template>

<style scoped>

</style>
