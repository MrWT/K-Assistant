<script setup>
    import { ref, reactive, onMounted, watch } from 'vue'
    import { fetchData } from "@/composables/fetchData"
    import { GoogleMap, AdvancedMarker, InfoWindow, Polyline } from 'vue3-google-map'

    const emit = defineEmits(['popupMessage']);
    const props = defineProps({
        title: String,
        account: String,
        googleMapApiKey: String
    })

    onMounted(() => {
        console.log("TripSchedule mounted.");
        init();
    });


    let appState = ref("");
    // 已排定的行程清單
    let scheduleList = reactive([]);
    // 行程細節 - 目的地國家
    let tripNation = "";
    let tripDestination = "";
    // 行程細節 - 每站清單/天
    let tripDetailList = reactive([]);
    // 行程細節 - 選定要查看的日期
    let sel_day_sequence = ref("");
    // 選擇要刪除的行程
    let selRemove_id = ref("");
    let selRemove_destination = ref("");
    let selRemove_trip_start_date = ref("");
    let selRemove_trip_end_date = ref("");

    // InfoWindow options
    let infoWindowObj = reactive({});
    // 圖標類型
    let googleMapMarkerType = reactive([]);
    // google map 初始中心點 - 台灣地理中心碑
    let mapCenter_lat = ref(23.974174340321614);
    let mapCenter_lng = ref(120.97984968163026);
    // google map mark
    let googleMapMarks = reactive([]);

    // 初始化 component
    function init(){
        console.log("PlanTrip.init");
        console.log("PlanTrip.props.title", props.title);
        console.log("PlanTrip.props.account", props.account);
        console.log("PlanTrip.props.googleMapApiKey", props.googleMapApiKey);

        fetchInitData();
    }
    // 取得初始資料
    function fetchInitData(){
        // 清空行程清單
        scheduleList.splice(0, scheduleList.length);
        // 取得行程清單
        let fetchTripSchedulePromise = fetchData({
            api: "get_trip_schedule",
            data: {
                account: props.account,
            }
        });
        Promise.all([fetchTripSchedulePromise]).then((values) => {
            console.log("fetchInitData.values=", values);

            values[0].sort((x, y) => {
                if(x["trip_start_date"] > y["trip_start_date"]){
                    return 1;
                }
                if(x["trip_start_date"] < y["trip_start_date"]){
                    return -1;
                }

                if(x["destination"] < y["destination"]){
                    return 1;
                }
                if(x["destination"] > y["destination"]){
                    return -1;
                }

                return 0;
            });
            values[0].forEach((schObj, sch_i) => {
                let schedule = JSON.parse(schObj["schedule"]);
                schedule["id"] = schObj["id"];
                scheduleList.push( schedule );
            });

            console.log("scheduleList=", scheduleList);

        });
    }
    // 開啟 trip detail modal
    function openTripDetailModal(scheduleObj){
        console.log("openTripDetailModal.scheduleObj=", scheduleObj);

        tripDetailList.splice(0, tripDetailList.length);
        scheduleObj.trip_detail.forEach((tdObj, td_i) => {
            tripDetailList.push(tdObj);
        });
        sel_day_sequence.value = tripDetailList[0].day_sequence;

        document.getElementById("tripDetailModal").showModal();

        tripNation = scheduleObj.nation;
        tripDestination = scheduleObj.destination;
        drawGoogleMapMarker();
    }
    // 繪畫圖標
    function drawGoogleMapMarker(){
        googleMapMarks.splice(0, googleMapMarks.length);

        let sel_day_sequence_obj = {};
        tripDetailList.forEach((tdObj, td_i) => {
            let day_sequence = tdObj.day_sequence;
            if(day_sequence === sel_day_sequence.value){
                sel_day_sequence_obj = tdObj;
            }
        });

        // 標註每個停靠點
        {
            let geoPromiseAry = [];
            sel_day_sequence_obj.trip_detail_of_day.forEach((tddObj, tdd_i) => {

                let locationName = tripNation;
                if( tddObj["subway_station"] && tddObj["subway_station"] !== "N/A" && tddObj["subway_station"].indexOf("無") < 0 ){
                    locationName += tddObj["subway_station"];
                }else{
                    locationName += tddObj["location"];
                }

                geoPromiseAry.push(fetchData({
                    api: "get_geocoded_from_google_map",
                    data: {
                        location_name: locationName,
                    }
                }));
            });
            Promise.all(geoPromiseAry).then((values) => {
                values.forEach((geoObj, geo_i) => {
                    let latitude_of_tddObj = geoObj[0];
                    let longitude_of_tddObj = geoObj[1];

                    googleMapMarks.push({
                        location_name: sel_day_sequence_obj.trip_detail_of_day[geo_i]["location"],
                        mark_date: sel_day_sequence_obj.day_sequence + " - " + ((geo_i + 1) < 10 ? "0" : "") + (geo_i + 1),
                        type: "plan_a_trip",
                        memo: sel_day_sequence_obj.trip_detail_of_day[geo_i]["memo"],
                        marker: {
                            position: { 
                                lat: latitude_of_tddObj, 
                                lng: longitude_of_tddObj 
                            },
                            title: sel_day_sequence_obj.trip_detail_of_day[geo_i]["location"],
                        }
                    });
                });
            });
        }
        
        // 將 google map 中心點定位在目的地
        {
            let fetchCenterPromise = fetchData({
                api: "get_geocoded_from_google_map",
                data: {
                    location_name: tripNation + tripDestination,
                }
            });
            Promise.all([fetchCenterPromise]).then((values) => {
                let latitude_of_tddObj = values[0][0];
                let longitude_of_tddObj = values[0][1];

                // 以目的地為中心點
                mapCenter_lat.value = latitude_of_tddObj;
                mapCenter_lng.value = longitude_of_tddObj;
            });
        }
    }
    // 開啟 InfoWindow
    function openInfoWindow(markObj){
        //console.log("openInfoWindow.markObj=", markObj);
        infoWindowObj.isOpen = true;
        infoWindowObj.options = {
            position: markObj.marker.position,
        };
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
    // 選擇 TripSumupObj
    function clickSelTripSumup(tdObj){
        // console.log("clickSelTripSumup.tdObj=", tdObj);

        sel_day_sequence.value = tdObj.day_sequence;
        drawGoogleMapMarker();
    }
    // 開啟 Remove 再確認 modal
    function openRemoveConfirmModal(scheduleObj){
        console.log("openRemoveConfirmModal.scheduleObj=", scheduleObj);

        selRemove_id.value = scheduleObj.id;
        selRemove_destination.value = scheduleObj.destination;
        selRemove_trip_start_date.value = scheduleObj.trip_start_date;
        selRemove_trip_end_date.value = scheduleObj.trip_end_date;
        console.log("openRemoveConfirmModal.selRemove_id=", selRemove_id.value);
        console.log("openRemoveConfirmModal.selRemove_destination=", selRemove_destination.value);
        console.log("openRemoveConfirmModal.selRemove_trip_start_date=", selRemove_trip_start_date.value);
        console.log("openRemoveConfirmModal.selRemove_trip_end_date=", selRemove_trip_end_date.value);

        document.getElementById("removeConfirmModal").showModal();
    }
    // 關閉 Remove 再確認 modal
    function closeRemoveConfirmModal(){
        document.getElementById("removeConfirmModal").close();
    }
    // 刪除已排定的行程
    function removeTrip(){
        console.log("removeTrip");

        let removeTripPromise = fetchData({
            api: "delete_trip_schedule",
            data: {
                id: selRemove_id.value,
            },
        });
        Promise.all([removeTripPromise]).then((values) => {
            console.log("removeTripPromise.values=", values);
            // 更新旅程清單
            fetchInitData();

            let opObj = {
                message: "",
                status: true,
            };
            opObj.status = values[0]["result"];
            if(values[0]["result"] === true){
                opObj.message = "刪除成功";
            }else{
                opObj.message = "Error: " + values[0]["message"];
            }
            // 將 message 傳給 App.vue 
            emit('popupMessage', opObj.status, opObj.message); // Emitting the event with data

            // 關閉 remove 再確認 modal
            closeRemoveConfirmModal();
            // 關閉 trip detail modal
            closeTripDetailModal();


        });
    }
    // 關閉 trip detail modal
    function closeTripDetailModal(){
        document.getElementById("tripDetailModal").close();
    }

</script>

<template>

<div class="w-1/1 h-1/1">
    <ul v-if="scheduleList.length > 0" class="list rounded-box shadow-md h-1/1">
        <li v-for="(sObj, s_i) in scheduleList" class="list-row hover:bg-yellow-100 items-center">
            <div class="text-4xl font-thin opacity-30 tabular-nums">{{ ((s_i + 1) < 10 ? "0" : "") + (s_i + 1) }}</div>
            <div class="list-col-grow">
                <div class="text-lg">
                    {{ sObj.destination }}
                </div>
                <div class="text-md uppercase font-semibold">{{ sObj.trip_start_date }} - {{ sObj.trip_end_date }}</div>
            </div>
            <a class="cursor-pointer text-red-500 hover:text-red-900" title="刪除規劃" @click="openRemoveConfirmModal(sObj)">
                <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 9-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
            </a>
            <a class="cursor-pointer text-gray-500 hover:text-gray-900" title="規劃內容" @click="openTripDetailModal(sObj)">
                <svg class="size-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 9h6m-6 3h6m-6 3h6M6.996 9h.01m-.01 3h.01m-.01 3h.01M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/>
                </svg>
            </a>
        </li>
    </ul>
    <div class="w-1/1 text-center bg-gray-300">
        <span class="text-gray-900 font-black text-3xl underline" v-if="scheduleList.length === 0">查無資料</span>
    </div>
</div>

<!-- tripDetail modal -->
<dialog id="tripDetailModal" class="modal">
    <div class="modal-box h-10/10 w-10/10 max-w-3xl flex flex-col bg-neutral-100">
        <div class="h-1/10 w-10/10 flex flex-row overflow-x-auto">
            <button v-for="(tdObj, td_i) in tripDetailList" class="btn btn-ghost" :class="{ 'border-black': sel_day_sequence === tdObj.day_sequence}" @click="clickSelTripSumup(tdObj)">
                {{ tdObj.day_sequence }}
            </button>
        </div>
        <div class="h-4/10 w-10/10 flex flex-col overflow-y-auto">
            <div v-for="(tdObj, td_i) in tripDetailList">
                <ul class="list bg-yellow-100 rounded-box shadow-md">
                    <li v-if="sel_day_sequence === tdObj.day_sequence" v-for="(tddObj, tdd_i) in tdObj.trip_detail_of_day" class="list-row">
                        <div class="text-4xl font-thin opacity-30 tabular-nums">{{ ((tdd_i + 1) < 10 ? "0" : "") + (tdd_i + 1) }}</div>
                        <div class="list-col-grow">
                            <div class="text-lg">
                                {{ tddObj.location }}
                                <span v-if="tddObj.subway_station && tddObj.subway_station !== 'N/A' && tddObj.subway_station.indexOf('無') < 0">{{ " - 地鐵: " + tddObj.subway_station }}</span>
                            </div>
                            <div class="text-md uppercase font-semibold">{{ tddObj.memo }}</div>
                        </div>
                    </li>
                </ul>

            </div>
        </div>
        <div class="h-5/10 w-10/10 flex flex-col mt-1">
            <GoogleMap class="w-10/10 h-10/10 border"
                mapId="PLAN_TRIP_MAP_ID"
                :api-key="props.googleMapApiKey"
                :center="{ lat: mapCenter_lat, lng: mapCenter_lng }"
                :zoom="10"
                :mapTypeControl = "false" 
                :streetViewControl = "false"
                >

                <InfoWindow class="flex flex-col gap-2 pr-5 w-1/1" :options="infoWindowObj.options" v-model="infoWindowObj.isOpen" @closeclick="closeInfoWindow">
                    <div class="text-lg text-black">{{ infoWindowObj.mark_date }} - {{ infoWindowObj.location_name }}</div>    
                    <div class="text-base text-black">{{ infoWindowObj.memo }}</div>    
                </InfoWindow>

                <AdvancedMarker v-for="(markObj, m_i) in googleMapMarks" :options="markObj.marker" :pin-options="{ background: 'red' }" @click="openInfoWindow(markObj)">
                </AdvancedMarker>        
            </GoogleMap>
        </div>
        <div class="modal-action">
            <button class="btn btn-ghost w-1/1 bg-gray-900 text-gray-100 hover:underline hover:bg-gray-100 hover:text-black" @click="closeTripDetailModal">
                <svg class="size-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 9-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
                關閉
            </button>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>

<!-- removeConfirm modal -->
<dialog id="removeConfirmModal" class="modal">
    <div class="modal-box h-5/10 w-10/10 flex flex-col bg-gray-200">
        <div class="h-2/10 w-10/10 text-center text-gray-900 font-black">
            <span class="text-2xl">刪除前, 再跟您確認一次~</span>
        </div>
        <div class="divider divider-error"></div>

        <div class="h-3/10 w-10/10 text-left text-xl text-gray-900 flex flex-col p-2">
            <div>
                目的地: {{ selRemove_destination }}
            </div>
            <div>
                日期: {{ selRemove_trip_start_date }} - {{ selRemove_trip_end_date }}
            </div>
        </div>

        <div class="divider divider-error"></div>
        <div class="modal-action gap-2 px-5">
            <button class="btn w-1/2 bg-gray-900 text-gray-200 hover:bg-yellow-200 hover:text-gray-900" @click="closeRemoveConfirmModal">
                取消
            </button>

            <button class="btn w-1/2 bg-gray-400 text-gray-900 hover:bg-yellow-200 " @click="removeTrip">
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
