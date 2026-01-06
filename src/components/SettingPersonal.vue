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
    });
    // language radio group 控制項
    let languageRadioParam = reactive({
        radioGroupName: 'rgLang', // 一致的 name 属性
        options: [
            { label: '英文', value: 'EN' },
            { label: '繁體中文', value: 'ZH_TW' }
        ],
        selectedOption: 'EN' // 預設選項
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

                languageRadioParam["selectedOption"] = values[0].language;
            }
        });
    }
    // 儲存個人資料
    function saveUser(){
        console.log("saveUser.userObj=", userObj);
        console.log("saveUser.languageRadioParam=", languageRadioParam);

        let postData = [{
            account: userObj["account"],
            name: userObj["name"],
            mail: userObj["mail"],
            app_title: userObj["app_title"],
            language: languageRadioParam["selectedOption"],
            role: userObj["role"],
        }];

        let saveUserPromise = fetchData({
            api: "save_users",
            data: postData
        });
        Promise.all([saveUserPromise]).then((values) => {
            console.log("saveUserPromise.values=", values);

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

    <div class="w-1/1 text-center text-3xl">
        個人資料設定
    </div>
    <div class="divider divider-primary"></div>

    <div class="w-1/1 flex flex-col gap-2 p-5">
        <div class="w-1/1 flex flex-row gap-2">
            <label class="label flex-none">姓名:</label>
            <input type="text" class="input flex-1" v-model="userObj.name" />
        </div>

        <div class="w-1/1 flex flex-row gap-2">
            <label class="label flex-none">Mail:</label>
            <input type="text" class="input flex-1" v-model="userObj.mail" />
        </div>

        <div class="w-1/1 flex flex-row gap-2">
            <label class="label flex-none">App 名稱: </label>
            <input type="text" class="input flex-1" v-model="userObj.app_title" />
        </div>

        <div class="w-1/1 flex flex-col">
            <label class="label">慣用語言:</label>
            <div class="w-1/1 flex flex-row gap-2">
                <label v-for="option in languageRadioParam.options" :key="option.value">
                    <input type="radio" class="radio" :value="option.value" :name="languageRadioParam.radioGroupName" v-model="languageRadioParam.selectedOption">
                    {{ option.label }}
                </label>
            </div>
        </div>
    </div>

    <div class="divider divider-primary"></div>
    <div class="w-1/1 flex flex-row gap-2 px-10">
        <button class="btn bg-gray-900 text-gray-100 hover:bg-yellow-200 hover:text-gray-900 w-1/2" @click="closeModal">
            關閉
        </button>
        <button class="btn bg-gray-200 text-gray-900 w-1/2 hover:bg-yellow-200" @click="saveUser">
            儲存
        </button>
    </div>

</template>

<style scoped>

</style>
