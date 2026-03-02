<template>
  <view class="container">
    <!-- 搜索框区域 -->
    <view class="search-box">
      <!-- 出发地和到达地 -->
      <view class="station-container">
        <view class="station-item" @click="goToStationSelect('from')">
          <text class="station-name">{{ fromStation || '北京' }}</text>
        </view>
        <view class="exchange-btn" @click="exchangeStations">
          <image src="/static/exchange.png" class="exchange-icon" />
        </view>
        <view class="station-item" @click="goToStationSelect('to')">
          <text class="station-name">{{ toStation || '上海' }}</text>
        </view>
      </view>
      
      <!-- 出发日期 -->
      <view class="date-container">
        <picker 
          mode="date" 
          :start="today" 
          :end="maxDate" 
          :value="departDate"
          @change="handleDateChange"
        >
          <view class="date-picker">
            {{ formatDate(departDate) }}
          </view>
        </picker>
      </view>
      
      <!-- 候选车站列表 -->
      <view v-if="showFromList && filteredFromStations.length > 0" class="station-list">
        <view 
          v-for="station in filteredFromStations" 
          :key="station" 
          class="station-option"
          @click="selectStation('from', station)"
        >
          {{ station }}
        </view>
      </view>
      <view v-if="showToList && filteredToStations.length > 0" class="station-list">
        <view 
          v-for="station in filteredToStations" 
          :key="station" 
          class="station-option"
          @click="selectStation('to', station)"
        >
          {{ station }}
        </view>
      </view>
      
      <!-- 查询按钮 -->
      <button 
        class="search-btn" 
        @click="searchTickets"
      >
        查询车票
      </button>
    </view>
    
    <!-- 查询历史 -->
    <view v-if="searchHistory.length > 0" class="history-section">
      <view class="history-list">
        <view 
          v-for="(item, index) in searchHistory" 
          :key="index" 
          class="history-item"
          @click="useHistory(item)"
        >
          <text>{{ item.from }}--{{ item.to }}</text>
        </view>
        <view class="history-item clear-history" @click="clearHistory">
          <text>清除历史</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getStationData, queryLeftTicket } from '../../utils/api';
import { getRecent15Days, saveSearchHistory, getSearchHistory, getStationCode, parseLeftTicketData, clearSearchHistory } from '../../utils/utils';

export default {
  data() {
    return {
      fromStation: '',
      toStation: '',
      departDate: '',
      today: '',
      maxDate: '',
      showFromList: false,
      showToList: false,
      filteredFromStations: [],
      filteredToStations: [],
      stationMap: {},
      searchHistory: []
    };
  },
  onLoad() {
    // 初始化日期
    const days = getRecent15Days();
    this.today = days[0];
    this.maxDate = days[14];
    this.departDate = days[1]; // 默认查第二天的
    
    // 加载车站数据
    this.loadStationData();
    
    // 加载查询历史
    this.searchHistory = getSearchHistory();
    
    // 设置默认出发和到达站
    if (this.searchHistory.length > 0) {
      // 如果有历史记录，使用最近的一条
      const latestHistory = this.searchHistory[0];
      this.fromStation = latestHistory.from;
      this.toStation = latestHistory.to;
    } else {
      // 如果没有历史记录，使用默认值
      this.fromStation = '北京';
      this.toStation = '上海';
    }
    
    // 监听车站选择事件
    uni.$on('stationSelected', (data) => {
      if (data.type === 'from') {
        this.fromStation = data.station;
      } else if (data.type === 'to') {
        this.toStation = data.station;
      }
    });
  },
  onUnload() {
    // 页面卸载时移除事件监听
    uni.$off('stationSelected');
  },
  methods: {
    async loadStationData() {
      // 从缓存或网络获取车站数据
      const stationMap = await getStationData();
      this.stationMap = stationMap;
    },
    exchangeStations() {
      // 交换出发地和到达地
      const temp = this.fromStation;
      this.fromStation = this.toStation;
      this.toStation = temp;
    },
    formatDate(dateStr) {
      // 格式化日期为 "3月5日 周四" 格式
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekDay = weekDays[date.getDay()];
      return `${month}月${day}日 ${weekDay}`;
    },
    goToStationSelect(type) {
      // 跳转到车站选择页面
      uni.navigateTo({
        url: `/pages/station-select/station-select?type=${type}`
      });
    },
    selectStation(type, station) {
      if (type === 'from') {
        this.fromStation = station;
        this.showFromList = false;
      } else {
        this.toStation = station;
        this.showToList = false;
      }
    },
    handleDateChange(e) {
      this.departDate = e.detail.value;
    },
    async searchTickets() {
      const from = this.fromStation;
      const to = this.toStation;
      
      // 保存查询历史
      const historyItem = {
        from: from,
        to: to,
        date: this.departDate
      };
      saveSearchHistory(historyItem);
      
      // 获取车站编码
      const fromCode = getStationCode(from);
      const toCode = getStationCode(to);
      
      if (!fromCode || !toCode) {
        uni.showToast({
          title: '车站信息错误',
          icon: 'none'
        });
        return;
      }
      
      // 查询余票
      uni.showLoading({
        title: '查询中...'
      });
      
      const result = await queryLeftTicket(this.departDate, fromCode, toCode);
      uni.hideLoading();
      
      if (result) {
        const tickets = parseLeftTicketData(result);
        const stationMap = result.data.map || {};
        // 跳转到车次页
        uni.navigateTo({
          url: `/pages/train/train?from=${from}&to=${to}&date=${this.departDate}&tickets=${encodeURIComponent(JSON.stringify(tickets))}&stationMap=${encodeURIComponent(JSON.stringify(stationMap))}`
        });
      } else {
        uni.showToast({
          title: '查询失败，请重试',
          icon: 'none'
        });
      }
    },
    useHistory(item) {
      this.fromStation = item.from;
      this.toStation = item.to;
      // 不带入日期，保持当前选择的日期
    },
    clearHistory() {
      clearSearchHistory();
      this.searchHistory = [];
    }
  }
};
</script>

<style>
.container {
  padding: 40rpx 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.search-box {
  background-color: white;
  border-radius: 10rpx;
  padding: 30rpx 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.station-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.station-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
}

.station-name {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
}

.exchange-btn {
  padding: 0 30rpx;
}

.exchange-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  border: 0;
}

.date-container {
  margin-bottom: 40rpx;
}

.date-picker {
  text-align: center;
  font-size: 32rpx;
  color: #333;
  padding: 10rpx 0;
}

.station-list {
  position: absolute;
  top: 200rpx;
  left: 20rpx;
  right: 20rpx;
  background-color: white;
  border: 1rpx solid #ddd;
  border-radius: 5rpx;
  max-height: 400rpx;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.station-option {
  padding: 20rpx;
  font-size: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.station-option:last-child {
  border-bottom: none;
}

.station-option:active {
  background-color: #f5f5f5;
}

.search-btn {
  width: 100%;
  height: 80rpx;
  background-color: #1E88E5;
  color: white;
  font-size: 36rpx;
  border-radius: 10rpx;
  margin-top: 10rpx;
}

.history-section {
  background-color: white;
  border-radius: 10rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  align-items: center;
}

.history-item {
  padding: 15rpx 20rpx;
  border: 1rpx solid #f0f0f0;
  border-radius: 5rpx;
  font-size: 28rpx;
  color: #666;
}

.history-item:active {
  background-color: #f5f5f5;
}

.clear-history {
  color: #999;
}

/* 为容器添加底部内边距，避免内容被底部菜单遮挡 */
.container {
  padding-bottom: 120rpx;
}
</style>