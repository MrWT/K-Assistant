<script setup>
    import { ref, reactive, onMounted } from 'vue'
    import moment from 'moment'
    import { fetchData } from "@/composables/fetchData"
    import { GoogleMap, AdvancedMarker, CustomControl, InfoWindow } from 'vue3-google-map'

    const emit = defineEmits(['popupMessage']);
    const props = defineProps({
        title: String,
        account: String,
        googleMapApiKey: String,
    })

    onMounted(() => {
        console.log("Footmark mounted.");
        init();
    });
    
    let account = ref(props.account);
    // screen size
    let screenSize = ref("md");
    let footmarks = reactive([]);
    // InfoWindow options
    let infoWindowObj = reactive({});
    // 圖標類型
    let googleMapMarkerType = reactive([]);
    // google map 初始中心點 - 台灣地理中心碑
    let mapCenter_lat = ref(23.974174340321614);
    let mapCenter_lng = ref(120.97984968163026);
    // google map mark
    let googleMapMarks = reactive([]);
    // style of mark
    let googleMapMarkPins = reactive([]);
    // 編輯 object
    let editObj = reactive({
        opMode: "EDIT",
        location_name: "",
        latitude: 0,
        longitude: 0,
        type: "ByGogoro",
        mark_date: moment().format("YYYY-MM-DD"),
        belong_to_user: props.account.toUpperCase(),
        memo: "",
    });
    
    // 初始化 component
    function init(){
        console.log("travel.init");
        console.log("props.title=", props.title);
        console.log("props.account=", props.account);
        console.log("props.googleMapApiKey=", props.googleMapApiKey);

        // w-sm 約等於 384px
        // w-md 約等於 448px
        if(window.innerWidth > 448){
            screenSize.value = "md";
        }else if(304 < window.innerWidth && window.innerWidth < 448 ){
            screenSize.value = "sm";
        }else{
            screenSize.value = "xs";
        }
        // 圖標類型預設值
        if(account.value.toUpperCase() === "BRYANT"){
            googleMapMarkerType.push("ByGogoro_Plan");
            googleMapMarkerType.push("ByGogoro");
        }else{
            googleMapMarkerType.push("WithFamily_Plan");
            googleMapMarkerType.push("WithFamily");
        }

        fetchFootmark();
    }
    // 取得踩點足跡
    function fetchFootmark(){
        googleMapMarks.splice(0, googleMapMarks.length);
        googleMapMarkPins.splice(0, googleMapMarkPins.length);

        let fetchFootmarkPromise = fetchData({
            api: "get_footmark",
            data: {
                account: props.account,
                marker_type: googleMapMarkerType.join(","),
            }
        });
        Promise.all([fetchFootmarkPromise]).then((values) => {
            console.log("fetchFootmarkPromise.values=", values);
            footmarks = values[0];

            let notPlanAlready = [];
            footmarks.forEach((fmObj, fm_i) => {
                let type = fmObj["type"];
                let markDate_of_fmObj = parseInt( moment(fmObj["mark_date"]).format("YYYYMMDD") );
                let today = parseInt( moment().format("YYYYMMDD") );

                if(markDate_of_fmObj <= today && type.indexOf("_Plan") >= 0){
                    notPlanAlready.push({
                        location_name: fmObj["location_name"],
                        type: type.split("_")[0],
                    });
                }
            });

            if(notPlanAlready.length > 0){
                finishPlan(notPlanAlready);
            }else{
                drawGoogleMapMarker();
            }
        });
    }
    // 轉換"計畫"成"完成"
    function finishPlan(notPlanAlready){
        console.log("finishPlan.notPlanAlready=", notPlanAlready);

        let cptfPromises = [];
        notPlanAlready.forEach((npaObj, npa_i) => {
            let finishPlanPromise = fetchData({
                api: "finish_footmark",
                data: {
                    location_name: npaObj["location_name"],
                    type: npaObj["type"],
                }
            });
            cptfPromises.push(finishPlanPromise);
        });

        Promise.all(cptfPromises).then((values) => {
            console.log("finish_footmark.values=", values);
            // 重新取得 footmark
            fetchFootmark();
        });
    }
    // 畫出圖標
    function drawGoogleMapMarker(){
        googleMapMarks.splice(0, googleMapMarks.length);
        googleMapMarkPins.splice(0, googleMapMarkPins.length);

        footmarks.forEach((fmObj, fm_i) => {
            if(googleMapMarkerType.includes(fmObj["type"])){
                googleMapMarks.push({
                    id: fmObj["id"],
                    location_name: fmObj["location_name"],
                    mark_date: fmObj["mark_date"],
                    type: fmObj["type"],
                    memo: fmObj["memo"],
                    marker: {
                        position: { lat: fmObj["latitude"], lng: fmObj["longitude"] },
                        title: fmObj["location_name"]
                    }
                });


                let markPin_background = "red";
                switch(fmObj["type"]){
                    case "ByGogoro_Plan": markPin_background = "white"; break;
                    case "ByGogoro": markPin_background = "red"; break;
                    case "WithFamily_Plan": markPin_background = "white"; break;
                    case "WithFamily": markPin_background = "pink"; break;
                }
                googleMapMarkPins.push({
                    background: markPin_background,
                });
            }
        });
    }
    // 開啟 InfoWindow
    function openInfoWindow(markObj){
        console.log("openInfoWindow.markObj=", markObj);
        infoWindowObj.isOpen = true;
        infoWindowObj.options = {
            position: markObj.marker.position,
        };
        infoWindowObj.id = markObj.id;
        infoWindowObj.location_name = markObj.location_name;
        infoWindowObj.mark_date = markObj.mark_date;
        infoWindowObj.type = markObj.type;
        infoWindowObj.memo = markObj.memo;
    }
    // 關閉 InfoWindow
    function closeInfoWindow(){
        //console.log("infoWindow.closeclick");
        infoWindowObj.isOpen = false;
    }
    // 切換圖標類型
    function changeMarkerType(e){
        e.preventDefault();
        console.log("changeMarkerType.event=", e);
        if(e.target.checked){
            googleMapMarkerType.push(e.target.value);
        }else{
            googleMapMarkerType.splice(googleMapMarkerType.indexOf(e.target.value), 1);
        }
        console.log("googleMapMarkerType=", googleMapMarkerType);

        fetchFootmark();
    }
    // 開啟編輯 modal
    function openEditModal(opMode){
        console.log("openEditModal.opMode=", opMode, infoWindowObj);

        document.getElementById("editMarkModal").showModal();

        editObj.opMode = opMode;
        if(opMode === "NEW"){
            editObj.id = "";
            editObj.location_name = "";
            editObj.mark_date = moment().format("YYYY-MM-DD");
            editObj.type = props.account === "BRYANT" ? "ByGogoro" : "WithFamily";
            editObj.memo = "";
        }else{
            editObj.id = infoWindowObj["id"];
            editObj.location_name = infoWindowObj["location_name"];
            editObj.mark_date = moment(infoWindowObj["mark_date"]).format("YYYY-MM-DD");
            editObj.type = infoWindowObj["type"];
            editObj.memo = infoWindowObj["memo"];
        }
    }
    // 關閉編輯 modal
    function closeEditModal(){
        document.getElementById("editMarkModal").close();
    }
    // 儲存 Mark 資訊
    function saveMark(){
        // 資料檢核
        if(!editObj.location_name || !editObj.mark_date || !editObj.type){
            emit('popupMessage', false, "請填好資料再儲存!"); // Emitting the event with data
            return;
        }

        // 新增 footmark
        console.log("saveMark.editObj=", editObj);
        closeInfoWindow();
        let newFootmarkPromise = fetchData({
            api: editObj["opMode"] === "EDIT" ? "edit_footmark" : "new_footmark",
            data: editObj,
        });
        Promise.all([newFootmarkPromise]).then((values) => {
            console.log("newFootmarkPromise.values=", values);

            fetchFootmark();
            closeEditModal();
        });
    }
</script>

<template>

    <div class="w-10/10 flex flex-col gap-2 justify-center">
        <label class="label">
            圖標類型:
        </label>
        <div class="w-10/10 flex flex-row gap-2 justify-center">
            <div v-if="account === 'BRYANT'" class="w-5/10 flex flex-col gap-2 justify-center">
                <label class="label">
                    <input type="checkbox" class="checkbox checkbox-neutral" value="ByGogoro_Plan" :checked="googleMapMarkerType.includes('ByGogoro_Plan')" @change="changeMarkerType" />
                    (計畫)騎車旅行
                </label>
                <label class="label">
                    <input type="checkbox" class="checkbox checkbox-error" value="ByGogoro" :checked="googleMapMarkerType.includes('ByGogoro')" @change="changeMarkerType" />
                    騎車旅行
                </label>
            </div>
            <div class="w-5/10 flex flex-col gap-2 justify-center">
                <label class="label">
                    <input type="checkbox" class="checkbox checkbox-neutral" value="WithFamily_Plan" :checked="googleMapMarkerType.includes('WithFamily_Plan')" @change="changeMarkerType" />
                    (計畫)家庭旅遊
                </label>
                <label class="label">
                    <input type="checkbox" class="checkbox checkbox-secondary" value="WithFamily" :checked="googleMapMarkerType.includes('WithFamily')" @change="changeMarkerType" />
                    家庭旅遊
                </label>
            </div>
        </div>
    </div>

    <div class="w-10/10 h-8/10 p-1 mt-2">
        <GoogleMap class="w-10/10 h-10/10"
            mapId="FOOTMARK_MAP_ID"
            :api-key="props.googleMapApiKey"
            :center="{ lat: mapCenter_lat, lng: mapCenter_lng }"
            :zoom="7"
            :mapTypeControl = "false" 
            :streetViewControl = "false"
            >
            
            <InfoWindow class="flex flex-col gap-2 pr-5 w-1/1" :options="infoWindowObj.options" v-model="infoWindowObj.isOpen" @closeclick="closeInfoWindow">
                <div class="flex flex-row items-center gap-3">
                    <div class="text-xl text-black">{{ infoWindowObj.mark_date }}</div>    
                    <button class="btn btn-circle bg-gray-900 text-gray-100 hover:bg-gray-100 hover:text-gray-900" @click="openEditModal('EDIT')">
                        <svg class="size-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path fill-rule="evenodd" d="M14 4.182A4.136 4.136 0 0 1 16.9 3c1.087 0 2.13.425 2.899 1.182A4.01 4.01 0 0 1 21 7.037c0 1.068-.43 2.092-1.194 2.849L18.5 11.214l-5.8-5.71 1.287-1.31.012-.012Zm-2.717 2.763L6.186 12.13l2.175 2.141 5.063-5.218-2.141-2.108Zm-6.25 6.886-1.98 5.849a.992.992 0 0 0 .245 1.026 1.03 1.03 0 0 0 1.043.242L10.282 19l-5.25-5.168Zm6.954 4.01 5.096-5.186-2.218-2.183-5.063 5.218 2.185 2.15Z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                </div>
                <div class="text-lg text-black">{{ infoWindowObj.location_name }}</div>    
                <div class="text-base text-black">{{ infoWindowObj.memo }}</div>    
            </InfoWindow>

            <AdvancedMarker v-for="(markObj, m_i) in googleMapMarks" :options="markObj.marker" :pin-options="googleMapMarkPins[m_i]" @click="openInfoWindow(markObj)">
            </AdvancedMarker>        
        
            <CustomControl v-if="true" position="TOP_LEFT">
                <button class="custom-btn p-3 cursor-pointer" @click="openEditModal('NEW')">
                    <svg class="size-10" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M8 7V2.221a2 2 0 0 0-.5.365L3.586 6.5a2 2 0 0 0-.365.5H8Zm2 0V2h7a2 2 0 0 1 2 2v.126a5.087 5.087 0 0 0-4.74 1.368v.001l-6.642 6.642a3 3 0 0 0-.82 1.532l-.74 3.692a3 3 0 0 0 3.53 3.53l3.694-.738a3 3 0 0 0 1.532-.82L19 15.149V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9h5a2 2 0 0 0 2-2Z" clip-rule="evenodd"/>
                        <path fill-rule="evenodd" d="M17.447 8.08a1.087 1.087 0 0 1 1.187.238l.002.001a1.088 1.088 0 0 1 0 1.539l-.377.377-1.54-1.542.373-.374.002-.001c.1-.102.22-.182.353-.237Zm-2.143 2.027-4.644 4.644-.385 1.924 1.925-.385 4.644-4.642-1.54-1.54Zm2.56-4.11a3.087 3.087 0 0 0-2.187.909l-6.645 6.645a1 1 0 0 0-.274.51l-.739 3.693a1 1 0 0 0 1.177 1.176l3.693-.738a1 1 0 0 0 .51-.274l6.65-6.646a3.088 3.088 0 0 0-2.185-5.275Z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </CustomControl>
        </GoogleMap>
    </div>

    <!-- 編輯 mark modal -->
    <dialog id="editMarkModal" class="modal modal-end">
        <div class="modal-box bg-gray-200 rounded-box p-2 w-1/1 flex flex-col gap-6">
            <div class="w-1/1 text-3xl font-black text-gray-900 text-center">
                <span v-if="editObj.opMode === 'EDIT'">編輯紀錄</span>
                <span v-if="editObj.opMode === 'NEW'">新增紀錄</span>
            </div>
            <div class="divider divider-primary"></div>

            <input type="text" placeholder="地點名稱" class="input input-info w-10/10" v-model="editObj.location_name" />

            <input type="date" placeholder="踩點日期" class="input input-info w-10/10" v-model="editObj.mark_date" />

            <input type="text" placeholder="備註" class="input input-info w-10/10" v-model="editObj.memo" />

            <div v-if="account === 'BRYANT'" class="flex flex-row gap-2 w-10/10">
                <label class="text-gray-900 text-lg w-5/10">
                    <input type="radio" v-model="editObj.type" value="ByGogoro_Plan" />
                    (計畫)電車踩點
                </label>
                <label class="text-gray-900 text-lg w-5/10">
                    <input type="radio" v-model="editObj.type" value="ByGogoro" checked />
                    電車踩點
                </label>
            </div>
            <div class="flex flex-row gap-2 w-10/10">
                <label class="text-gray-900 text-lg w-5/10">
                    <input type="radio" v-model="editObj.type" value="WithFamily_Plan" />
                    (計畫)家庭旅遊
                </label>
                <label class="text-gray-900 text-lg w-5/10">
                    <input type="radio" v-model="editObj.type" value="WithFamily" />
                    家庭旅遊
                </label>
            </div>

            <div class="divider divider-primary"></div>
            <div class="modal-action px-2">
                <button class="btn btn-ghost bg-gray-900 text-gray-100 hover:bg-gray-100 hover:text-gray-900 w-1/2" @click="closeEditModal">
                    <svg class="size-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 9-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                    </svg>
                    關閉
                </button>
                <button v-if="editObj.opMode === 'EDIT'" class="btn btn-ghost bg-gray-300 hover:bg-blue-300 w-1/2" @click="saveMark">
                    <svg class="size-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 3v4a1 1 0 0 1-1 1H5m4 6 2 2 4-4m4-8v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1Z"/>
                    </svg>
                    儲存
                </button>
                <button v-if="editObj.opMode === 'NEW'"  class="btn btn-ghost bg-gray-300 hover:bg-blue-300 w-1/2" @click="saveMark">
                    <svg class="size-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 3v4a1 1 0 0 1-1 1H5m4 6 2 2 4-4m4-8v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1Z"/>
                    </svg>
                    儲存
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
