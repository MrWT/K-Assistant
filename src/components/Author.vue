<script setup>
    import { ref, reactive, onMounted } from 'vue'

    const props = defineProps({
        title: String,
        account: String
    })

    onMounted(() => {
        console.log("Author mounted.");
        init();
    });

    let appState = ref("");
    let dataList = reactive([]);

    // 初始化 component
    function init(){
        console.log("author.init");
        console.log("author.props.title", props.title);

        genDataList();
    }     

    function genDataList(){
        dataList.push({
            time: "1987/04",
            title: "出生於台南市安南區土城",
            content: "",
        });

        dataList.push({
            time: "1994/09",
            title: "台南市立安慶國小",
            content: "",
        });

        dataList.push({
            time: "2000/09",
            title: "台南市立安南國中",
            content: "",
        });

        dataList.push({
            time: "2003/09",
            title: "台南高工-資訊科",
            content: "",
        });

        dataList.push({
            time: "2006/09",
            title: "台灣科技大學-資訊工程系",
            content: "",
        });

        dataList.push({
            time: "2010/09",
            title: "交通大學-資訊科學與工程甲組",
            content: "",
        });
    }

</script>

<template>

<div class="w-1/1 h-1/1 overlow-y-auto flex flex-col gap-2">
    <div class="text-lg">作者簡介</div>
    <div class="w-1/1 md:w-1/3 h-[300px] border border-gray-300 p-5 rounded-box">
        <div class="w-1/1 h-1/1 skeleton">

        </div>
    </div>
    <ul class="w-1/1 md:w-2/3 timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
        <li v-for="(dataObj, data_i) in dataList">
            <hr />
            <div class="timeline-middle">
                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                </svg>
            </div>
            <div :class="{'timeline-start mb-10 md:text-end': data_i % 2 === 0, 'timeline-end md:mb-10': data_i % 2 === 1}">
                <time class="font-mono italic">{{ dataObj.time }}</time>
                <div class="text-lg font-black">{{ dataObj.title }}</div>
                {{ dataObj.content }}
            </div>
            <hr />
        </li>
    </ul>
    <div class="divider"></div>
</div>

</template>

<style scoped>

</style>
