<script setup>
    import { ref, reactive, onMounted } from 'vue'
    import { fetchData } from "./composables/fetchData"

    import Login from './components/Login.vue'

    import Finance from './components/Finance.vue'
    import Gallery from './components/Gallery.vue'
    import Footmark from './components/Footmark.vue'
    import Readme from './components/Readme.vue'
    import Chat from './components/Chat.vue'
    import Imagen from './components/Imagen.vue'
    import PlanTrip from './components/PlanTrip.vue'
    import TripSchedule from './components/TripSchedule.vue'
    import Author from './components/Author.vue'
    import Recollection from './components/Recollection.vue'
    import Achievement from './components/Achievement.vue'
    import PopupMessage from './components/PopupMessage.vue'
    import SettingPersonal from './components/SettingPersonal.vue'

    // 郭家基金相關 component - 先寄生於此專案, 待成熟後, 再分家出去
    import QA from './components_kuoFund/QA.vue'
    import Recall from './components_kuoFund/Recall.vue'
    import Survey from './components_kuoFund/Survey.vue'
    import Finance_KF from './components_kuoFund/Finance.vue'
    import Rule_KF from './components_kuoFund/Rule.vue'
    import Activity_KF from './components_kuoFund/Activity.vue'

    onMounted(() => {
        console.log("App mounted.");
        init();

        // 沒有使用者資訊時, 就導引至 login.vue
        if(!userInfo.account){
            appSetting.contentComponent = "login";
            signinStatus.value = false;
        }
    });

    // 一般 - 功能設定
    let appSetting = reactive({
        state: "",
        contentComponent: "login",
        title: "",
        googleMapApiKey: "",
        reference: [],
        funButtons: [],
        imagenOption: {},
    });
    // 郭家基金 - 功能設定
    let kf_funSetting = reactive({
        bank_info: {},
        file_info: {},
        member: {},
        activity_annouce_period: {
            start: "",
            end: "",
        },
        agent: {
            name: "",
            phone: "",
            lineID: "",
            term:"",
        },
    });
    // 選擇的 component
    let selComponentName = ref("");
    // 登入狀態
    let signinStatus = ref(false);
    // 使用者資訊
    const userInfo = reactive({
        account: null,
        name: null,
        shortName: null,
        mail: null,
        role: null,
        funcs: [],
        languages: {},
        focus_news_topic: null,
    });
    // Popup Message
    let opObj = reactive({
        status: false,
        message: "",
    });

    // 初始化 app
    function init(){
        resetAppSetting();
        resetUserInfo();

        // 自動登入控制
        {
            const urlParams = new URLSearchParams(window.location.search);
            const user = urlParams.get('user'); // 取得 user

            if(user && user.trim()){
                // get_all_account
                let fetchAllAccount = fetchData({
                    api: "get_all_account",
                });

                Promise.all([fetchAllAccount]).then((values) => {
                    console.log("get_all_account.values=", values);

                    values[0].forEach((account, account_i) => {
                        if(account.toUpperCase() === user.trim().toUpperCase()){
                            signin(account.toUpperCase());
                        }
                    });
                });
            }else{
                gotoPage('login');
            }
        }
    }
    // 重設系統設定
    function resetAppSetting(){
        appSetting.contentComponent = "login";
        appSetting.title = "K-Assistant";

        selComponentName = "";
    }
    // 置換 component
    function gotoPage(selComponent) {
        let page = "";
        if(typeof selComponent === "string"){
            page = selComponent;
        }else{
            selComponentName = selComponent.display_text;
            page = selComponent.key;
        }

        if(page === "readme" || page === "gallery"){
            selComponentName = "";
        }

        // close userInfoModal
        document.getElementById("userInfoModal").close();

        appSetting.contentComponent = "reset";
        setTimeout(() => {
            appSetting.contentComponent = page;
        }, 200);
    }
    // 重設使用者資訊
    function resetUserInfo(){
        signinStatus.value = false;

        userInfo.account = null;
        userInfo.name = null;
        userInfo.shortName = null;
        userInfo.mail = null;
        userInfo.role = null;
        userInfo.funcs = [];
        userInfo.languages = {};
    }
    // 登入
    function signin(account){
        console.log("app.signin.account=[" + account + "]");

        if(account){
            let fetchAppSetting = fetchData({
                api: "get_app_setting",
            });

            let fetchUserData = fetchData({
                api: "login",
                data: {
                    account: account
                }
            });

            let fetchUserLanguage = fetchData({
                api: "get_language",
                data: {
                    account: account
                }
            });

            Promise.all([fetchAppSetting, fetchUserData, fetchUserLanguage]).then((values) => {
                console.log("signin.values=", values);

                if(!values || !values[1]){
                    signinStatus.value = false;
                    signout();
                    return;
                }
                signinStatus.value = true;

                let appSettingObj = values[0];
                console.log("appSettingObj=", appSettingObj);

                // appSetting.googleMapApiKey
                appSetting.googleMapApiKey = appSettingObj["google_map_api_key"];

                // 郭家基金 - 功能設定值
                kf_funSetting.bank_info = appSettingObj["kf_bank_info"];
                kf_funSetting.file_info = appSettingObj["kf_file_info"];
                kf_funSetting.member = appSettingObj["kf_member"];
                kf_funSetting.activity_annouce_period.start = appSettingObj["kf_activity_annouce_period"]["value1"];
                kf_funSetting.activity_annouce_period.end = appSettingObj["kf_activity_annouce_period"]["value2"];
                kf_funSetting.agent.name = appSettingObj["agent_name"];
                kf_funSetting.agent.phone = appSettingObj["agent_phone"];
                kf_funSetting.agent.lineID = appSettingObj["agent_line_id"];
                kf_funSetting.agent.term = appSettingObj["agent_term"];

                // appSetting.reference
                {
                    appSetting.reference = [];
                    appSettingObj["reference"].sort((x, y) => {
                        return x["seq"] - y["seq"];
                    });
                    appSettingObj["reference"].forEach((appSetObj, as_i) => {
                        appSetting.reference.push({
                            index: ((as_i + 1) < 10 ? "0" : "") + (as_i + 1),
                            name: appSetObj["key"],
                            text: appSetObj["display_text"],
                            link: appSetObj["link_url"],
                            arch: appSetObj["architecture"],
                        });
                    });
                }

                // user info
                let userInfoObj = values[1];
                {
                    console.log("userInfoObj=", userInfoObj);
                    userInfo.account = userInfoObj["account"];
                    userInfo.name = userInfoObj["name"];
                    userInfo.cname = userInfoObj["cname"];
                    userInfo.shortName = userInfo.name.substr(0, 1);
                    userInfo.mail = userInfoObj["mail"];
                    userInfo.role = userInfoObj["role"];
                    userInfo.funcs = userInfoObj["function"];
                    userInfo.focus_news_topic = userInfoObj["focus_news_topic"];
                    appSetting.title = userInfoObj["app_title"];
                }

                // user language
                {
                    let userLangObj = values[2];
                    console.log("userLangObj=", userLangObj);
                    userInfo.languages = {};
                    userLangObj["words"].forEach((word, w_i) => {
                        let w_key = word["name"];
                        let w_display = word["display_text"];

                        userInfo.languages[w_key] = w_display;
                    });
                }

                // 功能 buttons
                {
                    appSetting.funButtons.splice(0, appSetting.funButtons.length);

                    let allFunctionKeys = ["finance", "chat", "imagen", "plan_trip", "trip_schedule", "footmark", "recollection", "achievement", "finance_kf", "rule_kf", "activity_kf", "recall", "qa"];
                    let buildingFunctionKeys = [];
                    let buildingFunctionKeys_kf = [];
                    allFunctionKeys.forEach((funKey, fk_i) => {
                        if(userInfo.funcs.indexOf(funKey) >= 0){

                            if(buildingFunctionKeys.indexOf(funKey) >= 0 && userInfo.role === "admin"){
                                appSetting.funButtons.push({ key: funKey, display_text: userInfo.languages[funKey] });
                            }                            
                            if(buildingFunctionKeys_kf.indexOf(funKey) >= 0 && userInfo.role === "admin_kf"){
                               appSetting.funButtons.push({ key: funKey, display_text: userInfo.languages[funKey] });
                            }
                            if(buildingFunctionKeys.indexOf(funKey) < 0 && buildingFunctionKeys_kf.indexOf(funKey) < 0){
                               appSetting.funButtons.push({ key: funKey, display_text: userInfo.languages[funKey] });
                            }
                        }
                    });
                }

                if(userInfoObj["account"].toUpperCase() === "KUOFAMILY" || userInfoObj["role"] === "admin_kf"){
                    // 郭家基金成員 - 預設開啟基金明細 component
                    appSetting.funButtons.forEach((fbObj, fb_i) => {
                        if(fbObj["key"] === "finance_kf"){
                            gotoPage(fbObj);
                        }
                    });
                }else{
                    // 預設開啟 gallery component
                    gotoPage("gallery");
                }
            });
        }
    }
    // 登出
    function signout(){
        // close userInfoModal
        document.getElementById("userInfoModal").close();

        resetUserInfo();
        resetAppSetting();
    }
    // 前往作者簡介
    function gotoIntroduceAuthor(data){
        console.log("gotoIntroduceAuthor.data=", data);
        gotoPage("author");
    }
    // 使用者資訊
    function openUserInfoModal(){
        document.getElementById("userInfoModal").showModal();
    }
    // popup message
    function popupMessage(status, message){
        opObj.status = status;
        opObj.message = message;

        document.getElementById("alertMsg").classList.remove("hidden");

        setTimeout(() => {
            document.getElementById("alertMsg").classList.add("hidden");
        }, 5000);
    }
    // 開啟 set user data modal
    function openSetUserDataModal(){
        document.getElementById("setUserDataModal").showModal();
    }
    // 關閉 set user data modal
    function closeSetUserDataModal(){
        document.getElementById("setUserDataModal").close();
    }
    // 給 set user data Modal 使用的 function
    function modalStatus(opMode, message){
        if(opMode === "SAVE_SUCCESS"){
            popupMessage(true, message);
        }else if(opMode === "SAVE_FAIL"){
            popupMessage(false, message);
        }

        closeSetUserDataModal();
    }

</script>

<template>
    <!-- 系統 loading mask -->
    <div id="loading" class="w-1/1 h-1/1 content-center bg-gray-700/70 fixed top-0 left-0 z-[9999] hidden">
        <div class="w-1/1 text-center">
            <span class="loading loading-bars loading-xl"></span>
        </div>
    </div>

    <div class="navbar bg-base-100 shadow-sm z-[51] sticky top-0">
        <div class="navbar-start">
            <div v-if="signinStatus === true" class="dropdown">
                <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
                    <svg xmlns="http://www.w3.org/2000/svg" class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" /> </svg>
                </div>
                <ul tabindex="-1" class="menu menu-sm dropdown-content bg-gray-300 rounded-box z-1 mt-3 w-52 p-2 shadow">
                    <li v-for="(fbObj, fb_i) in appSetting.funButtons" @click="gotoPage(fbObj)" class="rounded-xl hover:bg-gray-900 hover:text-gray-100">
                        <a class='text-lg'>{{ fbObj.display_text }}</a>
                    </li>
                </ul>
            </div>
        </div>
        <div class="navbar-center items-center">
            <a v-if="userInfo.account && userInfo.account.toUpperCase() !== 'KUOFAMILY'" class="cursor-pointer bg-transparent border-0 border-yellow-300 hover:border-b-2" @click="gotoPage('gallery')">
                <span class="text-2xl">{{ appSetting.title }}</span>
            </a>

            <span v-if="userInfo.account && userInfo.account.toUpperCase() === 'KUOFAMILY'" class="text-2xl">
                {{ appSetting.title }}
            </span>

            <span v-if="selComponentName" class="text-2xl ml-2">
                <span class="text-xs">
                    >
                </span> 
                {{ selComponentName }}
            </span>

        </div>
        <div class="navbar-end gap-2">
            <!-- readme -->
            <a class="cursor-pointer tooltip tooltip-bottom" data-tip="系統資訊" @click="gotoPage('readme')">
                <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
            </a>
            <!-- userInfo -->
            <a v-if="signinStatus === true" class="cursor-pointer tooltip tooltip-bottom" data-tip="使用者資訊" @click="openUserInfoModal">
                <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4Zm10 5a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1Zm0 3a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1Zm0 3a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1Zm-8-5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm1.942 4a3 3 0 0 0-2.847 2.051l-.044.133-.004.012c-.042.126-.055.167-.042.195.006.013.02.023.038.039.032.025.08.064.146.155A1 1 0 0 0 6 17h6a1 1 0 0 0 .811-.415.713.713 0 0 1 .146-.155c.019-.016.031-.026.038-.04.014-.027 0-.068-.042-.194l-.004-.012-.044-.133A3 3 0 0 0 10.059 14H7.942Z" clip-rule="evenodd"/>
                </svg>
            </a>
            <!-- signin -->
            <a v-if="signinStatus === false" class="cursor-pointer tooltip tooltip-bottom" data-tip="登入" @click="gotoPage('login')">
                <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2"/>
                </svg>
            </a>
        </div>
    </div>

    <!-- 功能 component -->
    <div class="p-4 h-11/12">
        <!-- Login -->
        <Login v-if="appSetting.contentComponent === 'login'" @signin="signin" @popup-message="popupMessage" />

        <!-- component -->
        <Gallery v-if="appSetting.contentComponent === 'gallery'" :title="appSetting.title" :account="userInfo.account" :cname="userInfo.cname" :user_role="userInfo.role" :focus_news_topic="userInfo.focus_news_topic" @popup-message="popupMessage" />
        <Readme v-else-if="appSetting.contentComponent === 'readme'" :title="appSetting.title" :reference="appSetting.reference"  @introduce-author="gotoIntroduceAuthor" />
        <Footmark v-else-if="appSetting.contentComponent === 'footmark'" :title="appSetting.title" :account="userInfo.account" :googleMapApiKey="appSetting.googleMapApiKey" @popup-message="popupMessage" />
        <Finance v-else-if="appSetting.contentComponent === 'finance'" :title="appSetting.title" :account="userInfo.account" :user_role="userInfo.role" @popup-message="popupMessage" />
        <Chat v-else-if="appSetting.contentComponent === 'chat'" :title="appSetting.title" :account="userInfo.account" :user_role="userInfo.role" @popup-message="popupMessage" />
        <Imagen v-else-if="appSetting.contentComponent === 'imagen'" :title="appSetting.title" :account="userInfo.account" :user_role="userInfo.role" @popup-message="popupMessage" />
        <PlanTrip v-else-if="appSetting.contentComponent === 'plan_trip'" :title="appSetting.title" :account="userInfo.account" :googleMapApiKey="appSetting.googleMapApiKey" @popup-message="popupMessage" />
        <TripSchedule v-else-if="appSetting.contentComponent === 'trip_schedule'" :title="appSetting.title" :account="userInfo.account" :googleMapApiKey="appSetting.googleMapApiKey" @popup-message="popupMessage" />
        <Author v-else-if="appSetting.contentComponent === 'author'" :title="appSetting.title" />
        <Recollection v-else-if="appSetting.contentComponent === 'recollection'" :title="appSetting.title" :account="userInfo.account" :user_role="userInfo.role" @popup-message="popupMessage" />
        <Achievement v-else-if="appSetting.contentComponent === 'achievement'" :title="appSetting.title" :account="userInfo.account" :user_role="userInfo.role" />

        <!-- 郭家基金 - component -->
        <QA v-else-if="appSetting.contentComponent === 'qa'" :title="appSetting.title" :account="userInfo.account" :user_role="userInfo.role" @popup-message="popupMessage" />
        <Recall v-else-if="appSetting.contentComponent === 'recall'" :title="appSetting.title" :account="userInfo.account" :user_role="userInfo.role" @popup-message="popupMessage" />
        <Survey v-else-if="appSetting.contentComponent === 'survey'" :title="appSetting.title" :account="userInfo.account" />
        <Finance_KF v-else-if="appSetting.contentComponent === 'finance_kf'" :title="appSetting.title" :account="userInfo.account" :user_role="userInfo.role" @popup-message="popupMessage" />
        <Rule_KF v-else-if="appSetting.contentComponent === 'rule_kf'" :title="appSetting.title" :account="userInfo.account" :funSetting="kf_funSetting" />
        <Activity_KF v-else-if="appSetting.contentComponent === 'activity_kf'" :title="appSetting.title" :account="userInfo.account" :user_role="userInfo.role" :annouce_period_start="kf_funSetting.activity_annouce_period.start" :annouce_period_end="kf_funSetting.activity_annouce_period.end" />
    </div>

    <!-- userInfo modal -->
    <dialog id="userInfoModal" class="modal">
        <div class="modal-box bg-gray-800/80 rounded-box p-2 w-80 md:w-120">
            <li class="text-white text-lg">{{ userInfo.cname }}</li>
            <li v-if="userInfo.mail" class="text-white text-lg">{{ userInfo.mail }}</li>
            <div class="divider divider-primary"></div>
            <li class="flex flex-row gap-2 w-1/1 px-2">
                <button class="btn w-1/2 hover:bg-yellow-300 text-black" @click="openSetUserDataModal">
                    <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13v-2a1 1 0 0 0-1-1h-.757l-.707-1.707.535-.536a1 1 0 0 0 0-1.414l-1.414-1.414a1 1 0 0 0-1.414 0l-.536.535L14 4.757V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v.757l-1.707.707-.536-.535a1 1 0 0 0-1.414 0L4.929 6.343a1 1 0 0 0 0 1.414l.536.536L4.757 10H4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h.757l.707 1.707-.535.536a1 1 0 0 0 0 1.414l1.414 1.414a1 1 0 0 0 1.414 0l.536-.535 1.707.707V20a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-.757l1.707-.708.536.536a1 1 0 0 0 1.414 0l1.414-1.414a1 1 0 0 0 0-1.414l-.535-.536.707-1.707H20a1 1 0 0 0 1-1Z"/>
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                    </svg>
                    {{ "設定資料" }}
                </button>
                <button class="btn w-1/2 hover:bg-yellow-300 text-black" @click="signout">
                    <span v-if="userInfo.account">
                        {{ userInfo.languages["signout"] }}
                    </span>
                    <svg v-if="userInfo.account" class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2"/>
                    </svg>

                    <svg v-if="!userInfo.account" class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2"/>
                    </svg>
                    <span v-if="!userInfo.account">
                        {{ userInfo.languages["signin"] }}
                    </span>
                </button>
            </li>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button>close</button>
        </form>
    </dialog>

    <!-- set user data modal -->
    <dialog v-if="userInfo.account" id="setUserDataModal" class="modal modal-top">
        <div class="modal-box bg-white rounded-box p-2 w-1/1 h-4/5">
            <SettingPersonal :account="userInfo.account" @modal-status="modalStatus" />
        </div>
    </dialog>

    <PopupMessage id="alertMsg" class="hidden z-[999]" :status="opObj.status" :message="opObj.message" />
</template>

<style scoped>

</style>
