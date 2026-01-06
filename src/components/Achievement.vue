<script setup>
    import { ref, reactive, onMounted } from 'vue'
    import moment from 'moment'
    import { fetchData } from "@/composables/fetchData"

    const props = defineProps({
        title: String,
        account: String,
        user_role: String, 
    });

    onMounted(() => {
        console.log("Achievement mounted.");
        init();
    });

    let appState = ref("");
    // 未解鎖清單
    let nonAchieveEvents = reactive([]);
    // 已解鎖清單
    let achieveEvents = reactive([]);
    // 編輯物件
    let editObj_id = ref("");
    let editObj_description = ref("");
    let editObj_achieveTime = ref("");

    // 初始化 component
    function init(){
        console.log("Achievement.init");
        console.log("Achievement.props.title=", props.title);
        console.log("Achievement.props.account=", props.account);
        console.log("Achievement.props.user_role=", props.user_role);

        fetchInitData();
    }   
    // 取得初始資料
    function fetchInitData(){
        nonAchieveEvents.splice(0, nonAchieveEvents.length);
        achieveEvents.splice(0, achieveEvents.length);

        let fetchAchievementPromise = fetchData({
            api: "get_achievement",
            data: {
                account: props.account,
            }
        });
        Promise.all([fetchAchievementPromise]).then((values) => {
            console.log("fetchAchievementPromise.values=", values);

            values[0].forEach((aeObj, e_i) => {
                if(aeObj["achieve_time"]){
                    achieveEvents.push({
                        id: aeObj["id"],
                        description: aeObj["description"],
                        achieve_time: aeObj["achieve_time"],
                    });
                }else{
                    nonAchieveEvents.push({
                        id: aeObj["id"],
                        description: aeObj["description"],
                        achieve_time: aeObj["achieve_time"],
                    });
                }
            });

            nonAchieveEvents.sort((x, y) => {
                if(x["description"] > y["description"]) return 1;                
                if(x["description"] < y["description"]) return -1;                
                return 0;                
            });
            achieveEvents.sort((x, y) => {
                if(x["achieve_time"] > y["achieve_time"]) return -1;
                if(x["achieve_time"] < y["achieve_time"]) return 1;

                if(x["description"] > y["description"]) return 1;                
                if(x["description"] < y["description"]) return -1;                
                return 0;                
            });
        });
    }
    // 開啟 edit modal
    function openEditModal(selObj){
        document.getElementById("editModal").showModal();

        if(selObj.id){
            editObj_id.value = selObj.id;
            editObj_description.value = selObj.description;
            editObj_achieveTime.value = selObj.achieve_time;
        }else{
            editObj_id.value = "NEW";
            editObj_description.value = "";
            editObj_achieveTime.value = "";
        }

        console.log("openEditModal.editObj_id=" + editObj_id.value);
        console.log("openEditModal.editObj_description=" + editObj_description.value);
        console.log("openEditModal.editObj_achieveTime=" + editObj_achieveTime.value);
    }
    // 關閉 edit modal
    function closeEditModal(){
        document.getElementById("editModal").close();
    }
    // 儲存 edit 結果
    function saveEdit(){
        let api_name = editObj_id.value === "NEW" ? "new_achievement" : "upd_achievement";
        let doc_id = editObj_id.value === "NEW" ? "" : editObj_id.value;
        console.log("saveEdit.api_name=" + api_name);
        console.log("saveEdit.doc_id=" + doc_id);

        let editAchievementPromise = fetchData({
            api: api_name,
            data: {
                id: doc_id,
                account: props.account,
                description: editObj_description.value,
                achieve_time: editObj_achieveTime.value ?? "",
            }
        });
        Promise.all([editAchievementPromise]).then((values) => {
            console.log("editAchievementPromise.values=", values);

            fetchInitData();
            closeEditModal();
        });
    }
    // 開啟 delete modal
    function openDeleteModal(selObj){
        document.getElementById("deleteModal").showModal();

        editObj_id.value = selObj.id;
        editObj_description.value = "";
        editObj_achieveTime.value = "";

        console.log("openEditModal.editObj_id=" + editObj_id.value);
    }
    // 關閉 delete modal
    function closeDeleteModal(){
        document.getElementById("deleteModal").close();
    }
    // 儲存 delete 結果
    function deleteAchievement(){
        let api_name = "del_achievement";
        let doc_id = editObj_id.value;
        console.log("deleteAchievement.api_name=" + api_name);
        console.log("deleteAchievement.doc_id=" + doc_id);

        let deleteAchievementPromise = fetchData({
            api: api_name,
            data: {
                id: doc_id,
            }
        });
        Promise.all([deleteAchievementPromise]).then((values) => {
            console.log("deleteAchievementPromise.values=", values);

            fetchInitData();
            closeEditModal();
            closeDeleteModal();
        });
    }

</script>

<template>

<div class="h-1/1 w-1/1 flex flex-col md:flex-row gap-2 overflow-y-auto">
    <!-- 待解鎖清單 -->
    <ul class="list bg-base-100 rounded-box shadow-2xl">
        <li class="p-4 pb-2 tracking-wide text-gray-900 bg-yellow-300/50 text-3xl rounded-xl shadow-2xl z-10" 
            style="position: sticky; top:0;">
            待解鎖清單
        </li>

        <li v-for="(naObj, na_i) in nonAchieveEvents" class="list-row items-center">
            <div class="text-4xl font-thin opacity-30 tabular-nums">
                {{ ((na_i+1) < 10 ? "0" : "") + (na_i+1) }}
            </div>
            <div class="list-col-grow text-xl">
                <div>{{ naObj.description }}</div>
            </div>
            <a class="text-red-500 hover:text-red-900 cursor-pointer" @click="openDeleteModal(naObj)">
                <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
                </svg>
            </a>
            <a class="text-gray-500 hover:text-gray-900 cursor-pointer" @click="openEditModal(naObj)">
                <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.779 17.779 4.36 19.918 6.5 13.5m4.279 4.279 8.364-8.643a3.027 3.027 0 0 0-2.14-5.165 3.03 3.03 0 0 0-2.14.886L6.5 13.5m4.279 4.279L6.499 13.5m2.14 2.14 6.213-6.504M12.75 7.04 17 11.28"/>
                </svg>
            </a>
        </li>
    </ul>
    <!-- 已解鎖清單 -->
    <ul class="list bg-base-100 rounded-box shadow-2xl">
        <li class="p-4 pb-2 tracking-wide text-gray-900 bg-green-300/50 text-3xl rounded-xl shadow-2xl z-10" 
            style="position: sticky; top:0;">
            已解鎖清單
        </li>

        <li v-for="(aeObj, ae_i) in achieveEvents" class="list-row items-center">
            <div class="text-4xl font-thin opacity-30 tabular-nums">
                {{ ((ae_i+1) < 10 ? "0" : "") + (ae_i+1) }}
            </div>
            <div class="list-col-grow text-xl">
                <div>{{ aeObj.description }}</div>
                <div class="text-base">{{ aeObj.achieve_time }}</div>
            </div>
            <a class="text-red-500 hover:text-red-900 cursor-pointer" @click="openDeleteModal(aeObj)">
                <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
                </svg>
            </a>
            <a class="text-gray-500 hover:text-gray-900 cursor-pointer" @click="openEditModal(aeObj)">
                <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.779 17.779 4.36 19.918 6.5 13.5m4.279 4.279 8.364-8.643a3.027 3.027 0 0 0-2.14-5.165 3.03 3.03 0 0 0-2.14.886L6.5 13.5m4.279 4.279L6.499 13.5m2.14 2.14 6.213-6.504M12.75 7.04 17 11.28"/>
                </svg>
            </a>
        </li>
    </ul>
</div>

<!-- 新增功能 -->
<button class="btn btn-square bg-blue-300/70 border-0 border-black hover:border-2 absolute right-2 bottom-2 z-10" @click="openEditModal">
    <svg class="size-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/>
    </svg>
</button>

<!-- edit modal -->
<dialog id="editModal" class="modal modal-end">
    <div class="modal-box h-1/2 w-1/1 flex flex-col bg-neutral-100">
        <div class="flex flex-col justify-center">
            <span v-if="editObj_id === 'NEW'" class="text-lg text-gray-900 text-center">新增解鎖項目</span>
            <span v-if="editObj_id !== 'NEW'" class="text-lg text-gray-900 text-center">編輯解鎖項目</span>
            <div class="divider divider-primary"></div>
        </div>
        <div class="h-1/1 w-1/1 flex flex-col overflow-y-auto gap-2 rounded-2xl">
            <div class="w-1/1 flex flex-row px-2 justify-start">
                <label class="label text-gray-900 w-1/1">
                    描述:
                    <input type="text" class="w-1/1" v-model="editObj_description" />
                </label>
            </div>
            <div class="w-1/1 flex flex-row px-2 justify-start">
                <label class="label text-gray-900 w-1/1">
                    達成日期
                    <input type="date" class="w-1/1" v-model="editObj_achieveTime" />
                </label>
            </div>
        </div>

        <div class="divider divider-primary"></div>
        <div class="modal-action">
            <button class="btn btn-ghost w-1/2 bg-gray-900 text-gray-100 hover:bg-yellow-100 hover:text-gray-900" @click.stop="closeEditModal">
                關閉
            </button>

            <button class="btn btn-ghost w-1/2 bg-gray-200 text-gray-900 hover:bg-yellow-100" @click.stop="saveEdit">
                儲存
            </button>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>

<!-- delete modal -->
<dialog id="deleteModal" class="modal">
    <div class="modal-box h-3/10 w-10/10 flex flex-col bg-neutral-500">
        <div class="h-10/10 w-10/10 text-center text-white font-black">
            <span class="text-2xl">再跟您確認一次~</span>
            <div class="divider divider-primary"></div>
        </div>
        <div class="modal-action">
            <button class="btn btn-ghost w-1/2 text-gray-900 bg-gray-100 hover:bg-gray-500 hover:text-gray-100 hover:underline" @click="closeDeleteModal">
                取消
            </button>

            <button class="btn btn-ghost w-1/2 text-gray-900 bg-gray-100 hover:bg-gray-500 hover:text-gray-100 hover:underline" @click="deleteAchievement">
                確認
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
