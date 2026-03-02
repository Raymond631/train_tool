<template>
  <view class="container">
    <!-- 顶部搜索框 -->
    <view class="search-header">
      <view class="search-box">
        <input 
          v-model="searchText" 
          placeholder="请输入车站名称" 
          @input="handleSearch"
          class="search-input"
        />
      </view>
    </view>
    
    <!-- 车站列表 -->
    <view class="station-list">
      <view 
        v-for="station in filteredStations" 
        :key="station"
        class="station-item"
        @click="selectStation(station)"
      >
        {{ station }}
      </view>
    </view>
  </view>
</template>

<script>
import { getStationData } from '../../utils/api';

export default {
  data() {
    return {
      searchText: '',
      allStations: [],
      filteredStations: []
    };
  },
  onLoad(options) {
    // 接收参数，确定是出发站还是到达站
    this.type = options.type; // 'from' 或 'to'
    this.loadStations();
  },
  methods: {
    async loadStations() {
      // 加载车站数据
      const stationMap = await getStationData();
      
      // 获取所有车站名称并按拼音排序
      this.allStations = Object.keys(stationMap).sort((a, b) => {
        return a.localeCompare(b, 'zh-CN', { sensitivity: "accent", collation: "pinyin" });
      });
      
      // 初始显示所有车站
      this.filteredStations = [...this.allStations];
    },
    handleSearch() {
      if (!this.searchText) {
        // 清空输入框后显示所有车站
        this.filteredStations = [...this.allStations];
      } else {
        // 根据输入文本过滤车站
        this.filteredStations = this.allStations.filter(station => {
          return station.includes(this.searchText);
        });
      }
    },
    selectStation(station) {
      // 选择车站后返回首页，并传递选中的车站信息
      uni.navigateBack({
        delta: 1,
        success: () => {
          // 触发首页的事件，传递选中的车站信息
          uni.$emit('stationSelected', {
            type: this.type,
            station: station
          });
        }
      });
    }
  }
};
</script>

<style>
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.search-header {
  background-color: white;
  padding: 15rpx 0;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
}

.search-box {
  padding: 0 20rpx;
}

.search-input {
  width: 100%;
  height: 60rpx;
  border: 1rpx solid #ddd;
  border-radius: 30rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  background-color: #f5f5f5;
}

.station-list {
  background-color: white;
  border-radius: 10rpx;
  padding: 10rpx 0;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.station-item {
  padding: 20rpx;
  font-size: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.station-item:last-child {
  border-bottom: none;
}

.station-item:active {
  background-color: #f5f5f5;
}
</style>