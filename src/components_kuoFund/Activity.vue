<script setup>
    import { ref, reactive, onMounted } from 'vue'
    import moment from 'moment'
    import { fetchData } from "@/composables/fetchData"

    const props = defineProps({
        title: String,
        account: String,
        user_role: String, 
        annouce_period_start: String,
        annouce_period_end: String,
    });

    onMounted(() => {
        console.log("Activity mounted.");
        init();
    });

    let appState = ref("");

    let selActivityMonth = ref("");
    let activityMonthList = reactive([]);
    let activity_location = ref("");
    let activity_memo = ref("");
    let activity_date = ref("");
    let activity_address = ref("");
    let manualPages = reactive([]);

    let annoucement = reactive({
        thoughts: [
            "一起做公益",
            "一起 do something...",
            "又過了一年, 一起聚聚",
            "一起...",
            "一緒に...",
            "같이...",
        ],
        newTypes: [
            { 
                title: "一起認識愛(線上活動)", 
                memo: "透過「基金小幫手(AI)」收集回憶, 並編成專屬我們的故事書", 
                time: "即日起", 
            }, 
            { 
                title: "一起做公益(公益捐贈)", 
                memo: "(預計)透過「臺南市政府公益平台」或是其他公益團體", 
                time: "(預計)2026/02( 農曆年前 )", 
            }, 
            { 
                title: "一起 do something", 
                memo: "(預計)...", 
                time: "(預計)...", 
            }, 
            { 
                title: "一起聚聚(中秋烤肉活動)", 
                memo: "土城烤肉歡聚", 
                time: "(預計)2026/09/26( 晚 )", 
            }, 
        ],
    });

    // 初始化 component
    function init(){
        console.log("Activity.init");
        console.log("Activity.props.title=", props.title);
        console.log("Activity.props.account=", props.account);
        console.log("Activity.props.user_role=", props.user_role);
        console.log("Activity.props.annouce_period_start=", props.annouce_period_start);
        console.log("Activity.props.annouce_period_end=", props.annouce_period_end);

        get_activity_months();
        
        // 發出 annoucement
        {
            let now_date = moment().format("YYYY-MM-DD");
            if(props.annouce_period_start && props.annouce_period_start <= now_date 
              && props.annouce_period_end && now_date <= props.annouce_period_end ){
                openAnnouceModal();
            }
        }
    }   
    // 取得活動月份
    function get_activity_months(){
        let selMn = moment().format("YYYY-MM");

        let getActivityMonthPromise = fetchData({
            api: "get_activity_month",
        }, "KUO-FUNDS");
        Promise.all([getActivityMonthPromise]).then((values) => {
            console.log("getActivityMonthPromise.values=", values);
            // 先排序月份, 再建立清單
            values[0].sort((x, y) => {
                if(x > y) return 1;
                if(x < y) return -1;
                return 0;
            }).forEach((am, am_i) => {
                activityMonthList.push(am);
            });

            if(activityMonthList.length > 0){
                // 預設選擇當月份, 若當月份沒有在清單中, 則選擇接下來最接近的月份
                if(activityMonthList.indexOf(selMn) < 0){
                    for(let am_i = 0; am_i < activityMonthList.length; am_i++){
                        let am = activityMonthList[am_i];

                        if(selMn < am){
                            selMn = am;
                            break;
                        }
                    }
                }
                sel_activity_month( selMn );
            }
        });
    }
    // 依選擇的活動日期, 取得活動地點+活動說明
    function sel_activity_month(selMonth){
        console.log("sel_activity_month.selMonth=", selMonth);
        selActivityMonth.value = selMonth;
        get_activity();
    }
    // 取得活動內容
    function get_activity(){
        let getActivityPromise = fetchData({
            api: "get_activiy",
            data: {
                activity_month: selActivityMonth.value,
                user_role: props.user_role,
            },
        }, "KUO-FUNDS");
        Promise.all([getActivityPromise]).then((values) => {
            console.log("getActivityPromise.values=", values);

            if(values[0].length > 0){
                activity_location.value = values[0][0]["location_name"];
                activity_memo.value = values[0][0]["memo"];
                activity_address.value = values[0][0]["address"];
                activity_date.value = values[0][0]["date"];

                console.log("get_activity.activity_location=", activity_location.value);
                console.log("get_activity.activity_memo=", activity_memo.value);
                console.log("get_activity.activity_address=", activity_address.value);
                console.log("get_activity.activity_date=", activity_date.value);

                manualPages.splice(0, manualPages.length);
                if(activity_location.value){
                    values[0][0].pages.forEach((pageObj, page_i) => {
                        manualPages.push({
                            src: pageObj["page"],
                            alt: pageObj["memo"],
                        });
                    });
                }
            }
        });
    }
    // 開啟 google map 方便設定導航
    function openGoogleMap(){
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent( activity_location.value )}`;
        window.open(mapsUrl, '_blank');
    }
    // 發出公告
    function openAnnouceModal(){
        document.getElementById("annouceModal").showModal();
    }
    // 關閉公告
    function closeAnnouceModal(){
        document.getElementById("annouceModal").close();
    }
    
</script>

<template>

<div class="w-1/1 overflow-x-auto overflow-y-hidden flex flex-row gap-2 shadow-3xl mb-5">
    <button v-for="(am, am_i) in activityMonthList" @click="sel_activity_month(am)"
        class="btn btn-ghost rounded-none border-0 border-b-2 hover:border-rose-500"
        :class="{'border-amber-600': am === selActivityMonth, 'border-gray-500': am !== selActivityMonth}">
        {{ am }}
    </button>
</div>

<div class="w-1/1 h-9/10 flex flex-col gap-2 overflow-y-auto">
    <div class="w-1/1 h-3/10 p-1">
        <div class="w-1/1 flex flex-col font-black rounded-2xl sticky top-0"
            :class="{
                'bg-yellow-600 text-gray-900 ': selActivityMonth === '2026-02',
                'bg-emerald-500 text-gray-900 ': selActivityMonth === '2026-04',
                'bg-orange-400 text-gray-900 ': selActivityMonth === '2026-07',
                'bg-slate-400 text-gray-900 ': selActivityMonth === '2026-09',
            }">
            <div class="w-1/1 text-3xl text-center">{{ activity_location }}</div>
            <div class="w-1/1 text-xl text-center">{{ activity_memo }}</div>
        </div>
        <div class="w-10/10 mt-2 text-gray-900 text-xl flex justify-center">
            <svg class="size-6 text-gray-800 mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>

            {{ activity_date }}
        </div>
        <div class="w-10/10 mt-2 text-gray-900 text-lg flex justify-center cursor-pointer" @click="openGoogleMap">
            {{ activity_address }}

            <svg class="size-6 text-red-800 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.8 13.938h-.011a7 7 0 1 0-11.464.144h-.016l.14.171c.1.127.2.251.3.371L12 21l5.13-6.248c.194-.209.374-.429.54-.659l.13-.155Z"/>
            </svg>
        </div>
    </div>

    <div class="w-10/10 h-7/10 p-1">
        <div class="divider">活動說明</div>
        <div class="flex w-10/10 justify-center gap-2 py-2">
            <a v-for="(pageObj, page_i) in manualPages" :href="'#page_' + page_i" class="btn btn-xs">{{ page_i + 1 }}</a>
        </div>
        <div class="carousel rounded-box w-10/10">
            <div v-for="(pageObj, page_i) in manualPages" class="carousel-item w-10/10 justify-center" :id="'page_' + page_i">
                <img :src="pageObj.src" :alt="pageObj.alt" class="w-fit" />
            </div>
        </div>
    </div>
</div>

<!-- annouce modal -->
<dialog id="annouceModal" class="modal">
    <div class="modal-box h-49/50 w-49/50 flex flex-col bg-neutral-100">
        <div class="flex flex-col justify-center">
            <span class="text-3xl text-gray-900 text-center bg-stone-800/50 rounded-xl">活動規劃預告</span>
            <div class="divider divider-primary"></div>
        </div>
        <div class="h-4/5 w-1/1 overflow-y-auto flex flex-col gap-2">
            <!-- 活動型態調整考量 -->
            <ul class="list bg-base-100 rounded-box shadow-md">
                <li class="p-4 pb-2 tracking-wide text-center font-semibold text-base bg-emerald-200/50 text-2xl z-10" 
                    style="position: sticky; top:0px;">
                    規劃考量
                </li>
                <li class="list-row">
                    <div class="list-col-grow">
                        <p>
                            接任輪值代管人後,<br />
                            一直在思考這份匯聚大家的愛而成的基金,<br />
                            除了吃喝玩樂外, 是否還有另一種可能性呢 ?<br />
                            <br />
                            <span class="font-black text-blue-900">
                                基金經費目前處於重建階段, <br />
                                想讓基金能夠建立一定的基礎, 試著壯大基金,<br />
                                方便後續好應用.
                            </span><br />
                            在這樣的思維下, 這一年我們還可以有什麼方式呢 ?<br />
                            <br />

                            今年的活動規劃, 將以小活動為主 <br />
                            匯聚小愛, 發揮大愛 !<br /><br />
                            <span class="text-rotate text-xl duration-10000 w-1/1">
                                <span class="w-1/1 justify-items-center ">
                                    <span v-for="(thought, th_i) in annoucement.thoughts" 
                                        class="bg-gray-200 text-gray-900">
                                        [ {{ thought }} ]
                                    </span>
                                </span>
                            </span>
                        </p>
                    </div>
                </li>
            </ul>
            <!-- 活動新型態 -->
            <ul class="list bg-base-100 rounded-box shadow-md">
                <li class="p-4 pb-2 tracking-wide text-center font-semibold text-base bg-yellow-200/50 text-2xl z-10"
                    style="position:sticky; top:0px;">
                    規劃內容
                </li>
                <li v-for="(ntObj, nt_i) in annoucement.newTypes" class="list-row">
                    <div class="text-4xl font-thin opacity-30 tabular-nums">{{ ((nt_i+1) < 10 ? "0" : "") + (nt_i+1) }}</div>
                    <div class="list-col-grow">
                        <div class="text-xl font-black">{{ ntObj.title }}</div>
                        <div class="flex flex-row items-center gap-2">
                            <svg class="size-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m17 21-5-4-5 4V3.889a.92.92 0 0 1 .244-.629.808.808 0 0 1 .59-.26h8.333a.81.81 0 0 1 .589.26.92.92 0 0 1 .244.63V21Z"/>
                            </svg>
                            {{ ntObj.memo }}
                        </div>
                        <div class="flex flex-row items-center gap-2">
                            <svg class="size-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                            </svg>
                            {{ ntObj.time }}
                        </div>
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
