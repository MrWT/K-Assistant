<script setup>
    import { ref, reactive, onMounted } from 'vue'
    import moment from 'moment'

    const props = defineProps({
        status: Boolean,
        message: String,
    })

    onMounted(() => {
        console.log("PopupMessage mounted.");
        init();
    });
        
    // 初始化 component
    function init(){
        console.log("PopupMessage.init");
        console.log("props.status=", props.status);
        console.log("props.message=", props.message);
    }
    
</script>

<template>

    <div id="alertMsg" class="toast w-10/10">
        <div class="alert w-10/10 text-white text-xl" :class="{ 'alert-success': props.status == true, 'alert-error': props.status == false }">
            <span>{{ moment().format("HH:MM:SS") }} </span><span>{{ props.message }}</span>
        </div>
    </div>

</template>

<style scoped>

</style>
