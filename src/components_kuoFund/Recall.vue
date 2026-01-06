<script setup>
    import { ref, reactive, onMounted, watch } from 'vue'
    import { fetchData } from "@/composables/fetchData"

    const emit = defineEmits(['popupMessage']);
    const props = defineProps({
        title: String,
        account: String,
        user_role: String,
    })

    onMounted(() => {
        console.log("Recall mounted.");
        init();
    });


    let appState = ref("");
    // 回憶清單
    let recallList = reactive([]);
    // 選擇要查閱的回憶
    let selObj_id = ref(""); // firestore document id
    let selObj_abstract = ref(""); // 摘要
    let selObj_content = ref(""); // 內容
    // 生成的故事
    let write_story = reactive({
        status: "DONE",
        gen_time: "",
        content: "",
    });
    
    // 初始化 component
    function init(){
        console.log("Recall.init");
        console.log("Recall.props.title", props.title);
        console.log("Recall.props.account", props.account);
        console.log("Recall.props.user_role", props.user_role);

        fetchInitData();

        if(props.user_role !== "admin_kf"){
            openAnnouceModal();
        }
    }
    // 取得初始資料
    function fetchInitData(){
        // 清空回憶清單
        recallList.splice(0, recallList.length);
        // 取得回憶清單
        let fetchPromise_recall = fetchData({
            api: "get_recall",
        }, "KUO-FUNDS");
        Promise.all([fetchPromise_recall]).then((values) => {
            console.log("fetchInitData.values=", values);

            values[0].forEach((recallObj, r_i) => {
                recallList.push( recallObj );
            });
        });
    }
    // 開啟 Remove 再確認 modal
    function openRemoveConfirmModal(recallObj){
        console.log("openRemoveConfirmModal.recallObj=", recallObj);

        selObj_id.value = recallObj.doc_id;
        selObj_abstract.value = recallObj.abstract;
        selObj_content.value = recallObj.content;
        console.log("openRemoveConfirmModal.selObj_id=", selObj_id.value);
        console.log("openRemoveConfirmModal.selObj_abstract=", selObj_abstract.value);
        console.log("openRemoveConfirmModal.selObj_content=", selObj_content.value);

        document.getElementById("removeConfirmModal").showModal();
    }
    // 關閉 Remove 再確認 modal
    function closeRemoveConfirmModal(){
        document.getElementById("removeConfirmModal").close();
    }
    // 刪除回憶
    function removeRecall(){
        console.log("removeRecall.selRemove_id=", selObj_id.value);

        editRecall("DELETE");
    }
    // 開啟 detail modal
    function openDetailModal(recallObj){
        console.log("openDetailModal.recallObj=", recallObj);

        if(recallObj.hasOwnProperty("doc_id")){
            selObj_id.value = recallObj.doc_id;
            selObj_abstract.value = recallObj.abstract;
            selObj_content.value = recallObj.content;
        }else{
            selObj_id.value = "NEW";
            selObj_abstract.value = "";
            selObj_content.value = "";
        }

        document.getElementById("detailModal").showModal();
    }
    // 關閉 detail modal
    function closeDetailModal(){
        document.getElementById("detailModal").close();
    }
    // 更新回憶
    function editRecall(opMode){
        console.log("editRecall.selObj_id=", selObj_id.value);

        // 關閉 remove 再確認 modal
        closeRemoveConfirmModal();
        // 關閉 detail modal
        closeDetailModal();

        opMode = selObj_id.value === "NEW" ? "NEW" : opMode;

        let editPromise_recall = fetchData({
            api: "edit_recall",
            data: {
                doc_id: selObj_id.value,
                abstract: selObj_abstract.value,
                content: selObj_content.value,
                active: opMode === "DELETE" ? "N": "Y",
            },
        }, "KUO-FUNDS");
        Promise.all([editPromise_recall]).then((values) => {
            console.log("editPromise_recall.values=", values);
            // 更新回憶清單
            fetchInitData();

            let opObj = {
                message: "",
                status: true,
            };
            opObj.status = values[0]["result"];
            if(values[0]["result"] === true){
                if(opMode === "DELETE"){
                    opObj.message = "刪除成功";
                }else if(opMode === "EDIT"){
                    opObj.message = "編輯成功";
                }else{
                    opObj.message = "新增成功";
                }
            }else{
                opObj.message = "Error: " + values[0]["message"];
            }
            // 將 message 傳給 App.vue 
            emit('popupMessage', opObj.status, opObj.message); // Emitting the event with data
        });
    }
    // 發出公告
    function openAnnouceModal(){
        document.getElementById("annouceModal").showModal();
    }
    // 關閉公告
    function closeAnnouceModal(){
        document.getElementById("annouceModal").close();
    }
    // 開啟 story modal
    function openStoryModal(){
        document.getElementById("storyModal").showModal();

        write_story.status = "WRITING";
        write_story.content = "編寫故事中, 請稍等~~";

        // 編寫回憶故事
        let fetchPromise_writeStory = fetchData({
            api: "write_story",
        }, "KUO-FUNDS");
        Promise.all([fetchPromise_writeStory]).then((values) => {
            console.log("fetchPromise_writeStory.values=", values);

            let ai_msg = values[0]["message"];
            if(ai_msg.indexOf("ERROR:") === 0){
                if(ai_msg.indexOf("ERROR:429 RESOURCE_EXHAUSTED") === 0){
                    ai_msg = "AI 忙碌中... 請稍等再試試...";
                }
                emit('popupMessage', false, ai_msg); // Emitting the event with data
            }

            write_story.content = ai_msg;
            write_story.gen_time = values[0]["gen_time"];
            write_story.status = "DONE";
        });
    }
    // 關閉 story modal
    function closeStoryModal(){
        document.getElementById("storyModal").close();
    }

</script>

<template>

<div class="w-1/1 h-1/10 flex justify-end items-center bg-gray-500/50 rounded-xl gap-2">
    <button v-if="props.user_role === 'admin_kf'" class="btn text-gray-900 bg-lime-200 rounded-xl hover:bg-yellow-200" title="生成故事" @click="openStoryModal">
        生成故事
    </button>

    <button class="btn text-gray-900 bg-gray-200 rounded-xl hover:bg-yellow-200 mr-2" title="紀錄回憶" @click="openDetailModal">
        紀錄回憶
    </button>
</div>

<div class="w-1/1 h-9/10 overflow-y-auto">
    <ul v-if="recallList.length > 0" class="list rounded-box shadow-md">
        <li v-for="(rObj, r_i) in recallList" class="list-row hover:bg-yellow-100">
            <div class="text-4xl font-thin opacity-30 tabular-nums">{{ ((r_i + 1) < 10 ? "0" : "") + (r_i + 1) }}</div>
            <div class="list-col-grow flex items-center">
                <div class="text-lg">
                    {{ rObj.abstract }}
                </div>
            </div>
            <button class="btn rounded-xl text-red-900 hover:text-white hover:bg-red-900" title="刪除回憶" @click="openRemoveConfirmModal(rObj)">
                刪除
            </button>
            <button class="btn rounded-xl hover:bg-yellow-200" title="查閱回憶" @click="openDetailModal(rObj)">
                查閱
            </button>
        </li>
    </ul>
    <div class="w-1/1 text-center bg-gray-300">
        <span class="text-gray-900 font-black text-3xl underline" v-if="recallList.length === 0">查無資料</span>
    </div>
</div>

<!-- story modal -->
<dialog id="storyModal" class="modal modal-top">
    <div class="modal-box h-4/5 w-1/1 max-w-3xl flex flex-col bg-neutral-100">
        <div class="h-1/1 w-1/1 text-gray-900 font-black p-2">
            <span class="text-xl">
                <span>{{ "故事內容" }}</span>
            </span>
            <div class="divider divider-primary"></div>

            <div class="w-1/1 h-4/5 flex flex-col items-center justify-center">
                <div class="text-gray-500 text-lg">{{ write_story.gen_time }}</div>
                <textarea class="textarea h-1/1 w-1/1 flex-1 textarea-neutral textarea-lg"
                    :class="{'text-2xl':write_story.status === 'WRITING', 'text-base':write_story.status === 'DONE'}"                     
                    v-model="write_story.content" style="resize: none;" readonly></textarea>
            </div>
        </div>

        <div class="modal-action">
            <button class="btn btn-ghost w-1/1 bg-gray-900 text-gray-100 hover:underline hover:bg-gray-100 hover:text-black" @click="closeStoryModal" :disabled="write_story.status === 'WRITING'">
                <svg v-if="write_story.status !== 'WRITING'" class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 9-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
                <span v-if="write_story.status !== 'WRITING'">關閉</span>
                <span v-if="write_story.status === 'WRITING'" class="loading loading-infinity loading-xl"></span>
            </button>
        </div>
    </div>
</dialog>

<!-- recall detail modal -->
<dialog id="detailModal" class="modal">
    <div class="modal-box h-4/5 w-1/1 max-w-3xl flex flex-col bg-neutral-100">
        <div class="h-1/1 w-1/1 text-gray-900 font-black p-2">
            <span class="text-xl">
                <span v-if="selObj_id === 'NEW'">{{ "[ 新增內容 ]" }}</span>
                <span v-if="selObj_id !== 'NEW'">{{ "[ 編輯內容 ]" }}</span>
                <br />
            </span>
            <div class="divider divider-primary"></div>

            <div class="w-1/1 flex flex-row gap-2 items-center">
                <div class="text-lg flex-none bg-gray-300 px-2">摘要:</div>
                <input type="text" class="border-b p-1 flex-1 text-lg" v-model="selObj_abstract" />
            </div>

            <div class="w-1/1 h-3/5 flex flex-row gap-2 mt-2 items-start">
                <div class="text-lg flex-none bg-gray-300 px-2">內容:</div>
                <textarea class="textarea h-1/1 flex-1 textarea-neutral textarea-lg" v-model="selObj_content" style="resize: none;"></textarea>
            </div>
        </div>

        <div class="modal-action">
            <button class="btn btn-ghost w-1/2 bg-gray-900 text-gray-100 hover:underline hover:bg-gray-100 hover:text-black" @click="closeDetailModal">
                <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 9-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
                關閉
            </button>

            <button class="btn btn-ghost w-1/2 bg-gray-200 text-gray-900 hover:underline hover:bg-yellow-300 hover:text-black" @click="editRecall('EDIT')">
                <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M10 3v4a1 1 0 0 1-1 1H5m14-4v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1Z"/>
                </svg>
                儲存
            </button>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>

<!-- remove recall modal -->
<dialog id="removeConfirmModal" class="modal">
    <div class="modal-box h-5/10 w-10/10 flex flex-col bg-neutral-500">
        <div class="h-2/10 w-10/10 text-center text-gray-100 font-black">
            <span class="text-2xl">刪除前, 再跟您確認一次~</span>
            <div class="divider divider-error"></div>
        </div>
        <div class="h-5/10 w-1/1 text-gray-900 p-2">
            <div class="w-1/1 bg-gray-100 text-lg">{{ selObj_abstract }}</div>
            <textarea class="textarea-neutral textarea-lg w-1/1 h-4/5 mt-2 bg-gray-100" readonly>{{ selObj_content }}</textarea>
        </div>
        <div class="divider divider-error"></div>
        <div class="modal-action">
            <button class="btn btn-ghost w-1/2 text-gray-100 hover:bg-gray-100 hover:text-gray-900 hover:underline" @click="closeRemoveConfirmModal">
                取消
            </button>

            <button class="btn btn-ghost w-1/2 text-gray-100 hover:bg-gray-100 hover:text-gray-900 hover:underline" @click="removeRecall">
                確認
            </button>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>

<!-- annouce modal -->
<dialog id="annouceModal" class="modal">
    <div class="modal-box h-49/50 w-49/50 flex flex-col bg-neutral-100">
        <div class="flex flex-col justify-center">
            <span class="text-3xl text-gray-900 text-center bg-stone-800/50 rounded-xl">填寫時, 注意事項</span>
            <div class="divider divider-primary"></div>
        </div>
        <div class="h-4/5 w-1/1 overflow-y-auto flex flex-col gap-2">
            <!-- 活動型態調整考量 -->
            <ul class="list bg-base-100 rounded-box shadow-md">
                <!-- 需要做的事 -->
                <li class="list-row bg-lime-200 hover:bg-yellow-100">
                    <div>
                        <svg class="size-10 text-green-900" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5"/>
                        </svg>
                    </div>
                    <div>
                        <div class="text-lg">心裡的土城</div>
                        <div class="text-base opacity-80">描寫對於土城, 心中的任何情感</div>
                    </div>
                </li>
                <li class="list-row bg-lime-200 hover:bg-yellow-100">
                    <div>
                        <svg class="size-10 text-green-900" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5"/>
                        </svg>
                    </div>
                    <div>
                        <div class="text-lg">印象中的土城</div>
                        <div class="text-base opacity-80">描寫對於土城, 聖母廟, 腦中還記得的點點滴滴</div>
                    </div>
                </li>
                <li class="list-row bg-lime-200 hover:bg-yellow-100">
                    <div>
                        <svg class="size-10 text-green-900" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5"/>
                        </svg>
                    </div>
                    <div>
                        <div class="text-lg">舌尖上的土城</div>
                        <div class="text-base opacity-80">描寫對於土城, 舌尖上曾嚐過的難忘美味</div>
                    </div>
                </li>

                <!-- 不要做的事 -->
                <li class="list-row bg-rose-200 hover:bg-yellow-100">
                    <div>
                        <svg class="size-10 text-red-900" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
                        </svg>
                    </div>
                    <div>
                        <div class="text-lg">不要填寫個人資料</div>
                        <div class="text-base opacity-60">只收回憶, 不收個資</div>
                    </div>
                </li>
                <li class="list-row bg-rose-200 hover:bg-yellow-100">
                    <div>
                        <svg class="size-10 text-red-900" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
                        </svg>
                    </div>
                    <div>
                        <div class="text-lg">不要填寫個人資料</div>
                        <div class="text-base opacity-60">只對回憶有感覺, 對個資沒興趣</div>
                    </div>
                </li>
                <li class="list-row bg-rose-200 hover:bg-yellow-100">
                    <div>
                        <svg class="size-10 text-red-900" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
                        </svg>
                    </div>
                    <div>
                        <div class="text-lg">不要填寫個人資料</div>
                        <div class="text-base opacity-60">填了也沒用, AI 就是沒興趣</div>
                    </div>
                </li>
            </ul>
        </div>
        <div class="divider divider-primary"></div>
        <div class="modal-action">
            <button class="btn btn-ghost w-1/1 bg-gray-900 text-gray-200 hover:bg-yellow-100 hover:text-gray-900" @click="closeAnnouceModal">
                關閉
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
