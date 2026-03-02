<template>
  <view class="container">
    <view class="header">
      <text class="header-text">{{ from }} → {{ to }}</text>
      <text class="header-date">{{ date }}</text>
    </view>
    
    <!-- 筛选条件 -->
    <view class="filter-section">
      <view class="section-header" @click="toggleFilter">
        <text class="section-title">筛选条件</text>
        <text class="section-arrow">{{ isFilterCollapsed ? '▼' : '▲' }}</text>
      </view>
      <view v-if="!isFilterCollapsed">
        <view class="filter-item">
          <text class="filter-label">出发车站</text>
          <view class="station-select">
            <text 
              v-for="station in allFromStations" 
              :key="station" 
              class="station-tag"
              :class="{ 'selected': filter.fromStations.includes(station) }"
              @click="toggleFromStation(station)"
            >
              {{ station }}
            </text>
          </view>
        </view>
        
        <view class="filter-item">
          <text class="filter-label">到达车站</text>
          <view class="station-select">
            <text 
              v-for="station in allToStations" 
              :key="station" 
              class="station-tag"
              :class="{ 'selected': filter.toStations.includes(station) }"
              @click="toggleToStation(station)"
            >
              {{ station }}
            </text>
          </view>
        </view>
        
        <view class="filter-item">
          <text class="filter-label">价格小于</text>
          <input type="number" v-model="filter.maxPrice" placeholder="请输入价格, 如:200" @change="applyFilter" />
        </view>

        <view class="filter-item flex-end">
          <view>
            <text class="filter-label">仅看有票</text>
            <switch :checked="filter.hasTicket" @change="handleHasTicketChange" />
          </view>
          <button class="reset-btn" @click="resetFilter">重置筛选</button>
        </view>
      </view>
    </view>

    <!-- 排序方式 -->
    <view class="filter-section">
      <view class="section-header" @click="toggleSort">
        <text class="section-title">排序方式</text>
        <text class="section-arrow">{{ isSortCollapsed ? '▼' : '▲' }}</text>
      </view>
      <view v-if="!isSortCollapsed">
        <view class="filter-item">
          <text class="filter-label">排序方式</text>
          <view class="sort-select">
            <text 
              v-for="sortOption in sortOptions" 
              :key="sortOption.value" 
              class="sort-tag"
              :class="{ 'selected': sortBy === sortOption.value }"
              @click="sortBy = sortOption.value"
            >
              {{ sortOption.label }}
            </text>
          </view>
        </view>
      </view>
    </view>
    

    
    <view v-if="filteredTrains.length > 0" class="train-list">
      <view 
        v-for="(train, index) in filteredTrains" 
        :key="`${train.station_train_code}_${index}`" 
        class="train-item"
        @click="goToTrainDetail(train)"
      >
        <view class="train-info">
          <view class="time-line">
            <view class="time-point">
              <text class="time">{{ train.start_time }}</text>
              <text class="station">{{ train.from_station_name || from }}</text>
            </view>
            <view class="arrow-line">
              <text class="lishi">{{ train.lishi }}</text>
              <image src="/static/arrow.png" class="arrow"></image>
              <text class="train-code">{{ train.station_train_code }}</text>
            </view>
            <view class="time-point">
              <text class="time">{{ train.arrive_time }}</text>
              <text class="station">{{ train.to_station_name || to }}</text>
            </view>
            <view class="price-point">
              <text class="price">¥{{ getMinPrice(train) }}起</text>
            </view>
          </view>
        </view>
        
        <view class="seat-section">
          <view 
            v-for="seat in sortedSeats(train)" 
            :key="seat.type"
            class="seat-item"
            :class="{ 
              'has-ticket': seat.available, 
              'no-ticket': !seat.available 
            }"
          >
            <text class="seat-name">{{ seat.name }}</text>
            <text class="seat-count" :class="{ 'no-ticket-text': !seat.available }">
              {{ seat.available ? seat.count : '无' }}
            </text>
            <text class="seat-price">¥{{ seat.price }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <view v-else class="empty-train">
      <text>暂无符合条件的车次</text>
    </view>
  </view>
</template>

<script>
import { getPriceYp, sortedSeats } from '../../utils/utils';

export default {
  data() {
    return {
      from: '',
      to: '',
      date: '',
      trains: [],
      stationMap: {},
      allFromStations: [],
      allToStations: [],
      // 筛选条件
      filter: {
        hasTicket: false,
        maxPrice: '',
        fromStations: [],
        toStations: []
      },
      // 排序方式
      sortBy: 'startTime', // 默认按出发时间排序
      sortOptions: [
        { value: 'startTime', label: '出发时间' },
        { value: 'arriveTime', label: '到达时间' },
        { value: 'duration', label: '历时' },
        { value: 'price', label: '价格' }
      ],
      // 折叠状态
      isFilterCollapsed: true,
      isSortCollapsed: true

    };
  },
  computed: {
    // 筛选后的车次
    filteredTrains() {
      const filtered = this.trains.filter(train => {
        // 1. 出发车站筛选
        if (this.filter.fromStations.length > 0) {
          const fromStation = train.from_station_name || this.from;
          const fromStationMatch = this.filter.fromStations.includes(fromStation);
          if (!fromStationMatch) {
            return false;
          }
        }
        
        // 2. 到达车站筛选
        if (this.filter.toStations.length > 0) {
          const toStation = train.to_station_name || this.to;
          const toStationMatch = this.filter.toStations.includes(toStation);
          if (!toStationMatch) {
            return false;
          }
        }
        
        // 3. 是否仅看有票
        if (this.filter.hasTicket) {
          const seats = sortedSeats(train);
          const hasAvailableSeat = seats.some(seat => seat.available);
          if (!hasAvailableSeat) {
            return false;
          }
        }
        
        // 4. 价格限制
        if (this.filter.maxPrice) {
          const seats = sortedSeats(train);
          const hasCheapSeat = seats.some(seat => seat.price <= Number(this.filter.maxPrice));
          if (!hasCheapSeat) {
            return false;
          }
        }
        
        return true;
      });
      
      // 排序
      const sorted = this.sortTrains([...filtered]);
      return sorted;
    }
  },
  onLoad(options) {
    // 接收传递的参数
    this.from = options.from;
    this.to = options.to;
    this.date = options.date;
    this.trains = JSON.parse(decodeURIComponent(options.tickets));
    this.stationMap = JSON.parse(decodeURIComponent(options.stationMap || '{}'));
    
    // 为每个车次添加车站名称
    this.trains = this.trains.map(train => {
      return {
        ...train,
        from_station_name: this.stationMap[train.from_station_telecode] || this.from,
        to_station_name: this.stationMap[train.to_station_telecode] || this.to
      };
    });
    
    // 聚合所有可能的出发站和到达站
    this.allFromStations = [...new Set(this.trains.map(train => train.from_station_name))];
    this.allToStations = [...new Set(this.trains.map(train => train.to_station_name))];
    
    // 初始化出发和到达车站，默认选中全部
    this.filter.fromStations = [...this.allFromStations];
    this.filter.toStations = [...this.allToStations];
  },
  methods: {
    // 排序席位：价格便宜的放前面
    sortedSeats(train) {
      return sortedSeats(train);
    },
    // 处理仅看有票开关变化
    handleHasTicketChange(e) {
      this.filter.hasTicket = e.detail.value;
    },
    // 应用筛选
    applyFilter() {
      // 筛选逻辑在computed的filteredTrains中处理
    },
    // 重置筛选
    resetFilter() {
      this.filter = {
        hasTicket: false,
        maxPrice: '',
        fromStations: [...this.allFromStations],
        toStations: [...this.allToStations]
      };
    },
    // 切换出发车站选中状态
    toggleFromStation(station) {
      if (this.filter.fromStations.includes(station)) {
        // 如果已选中，且不是最后一个选中的，则取消选中
        if (this.filter.fromStations.length > 1) {
          this.filter.fromStations = this.filter.fromStations.filter(s => s !== station);
        } else {
          // 如果是最后一个选中的，则不允许取消
          uni.showToast({
            title: '至少要选中1个出发车站',
            icon: 'none'
          });
        }
      } else {
        // 如果未选中，则添加选中
        this.filter.fromStations.push(station);
      }
    },
    // 切换到达车站选中状态
    toggleToStation(station) {
      if (this.filter.toStations.includes(station)) {
        // 如果已选中，且不是最后一个选中的，则取消选中
        if (this.filter.toStations.length > 1) {
          this.filter.toStations = this.filter.toStations.filter(s => s !== station);
        } else {
          // 如果是最后一个选中的，则不允许取消
          uni.showToast({
            title: '至少要选中1个到达车站',
            icon: 'none'
          });
        }
      } else {
        // 如果未选中，则添加选中
        this.filter.toStations.push(station);
      }
    },
    // 排序车次
    sortTrains(trains) {
      if (!Array.isArray(trains)) {
        return [];
      }
      
      const sortedTrains = [...trains];
      
      switch (this.sortBy) {
        case 'startTime':
          // 按出发时间排序
          return sortedTrains.sort((a, b) => {
            return a.start_time.localeCompare(b.start_time);
          });
        case 'arriveTime':
          // 按到达时间排序
          return sortedTrains.sort((a, b) => {
            return a.arrive_time.localeCompare(b.arrive_time);
          });
        case 'duration':
          // 按历时从小到大排序
          return sortedTrains.sort((a, b) => {
            const [aHours, aMinutes] = a.lishi.split(':').map(Number);
            const [bHours, bMinutes] = b.lishi.split(':').map(Number);
            const aTotal = aHours * 60 + aMinutes;
            const bTotal = bHours * 60 + bMinutes;
            return aTotal - bTotal;
          });
        case 'price':
          // 按价格从低到高排序（取所有席位中价格最低的）
          return sortedTrains.sort((a, b) => {
            const aSeats = sortedSeats(a);
            const bSeats = sortedSeats(b);
            const aMinPrice = aSeats.length > 0 ? Math.min(...aSeats.map(seat => seat.price)) : Infinity;
            const bMinPrice = bSeats.length > 0 ? Math.min(...bSeats.map(seat => seat.price)) : Infinity;
            return aMinPrice - bMinPrice;
          });
        default:
          return sortedTrains;
      }
    },


    goToTrainDetail(train) {
      // 跳转到车次详情页
      uni.navigateTo({
        url: `/pages/train-detail/train-detail?train_no=${train.train_no}&from_station=${train.from_station_telecode}&to_station=${train.to_station_telecode}&date=${this.date}&train_code=${train.station_train_code}&from_name=${train.from_station_name}&to_name=${train.to_station_name}&start_time=${train.start_time}&arrive_time=${train.arrive_time}&lishi=${train.lishi}`
      });
    },
    getMinPrice(train) {
      // 计算最低票价
      const prices = train.yp_info_new ? getPriceYp(train.yp_info_new) : [];
      const validPrices = prices.filter(price => price > 0);
      return validPrices.length > 0 ? Math.min(...validPrices) : 0;
    },
    // 切换筛选条件折叠状态
    toggleFilter() {
      this.isFilterCollapsed = !this.isFilterCollapsed;
    },
    // 切换排序方式折叠状态
    toggleSort() {
      this.isSortCollapsed = !this.isSortCollapsed;
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

.header {
  background-color: white;
  padding: 20rpx;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

/* 筛选条件 */
.filter-section {
  background-color: white;
  padding: 0;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  cursor: pointer;
  border-bottom: 1rpx solid #f0f0f0;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.section-arrow {
  font-size: 24rpx;
  color: #999;
  transition: transform 0.3s ease;
}

.section-header + view {
  padding: 0 20rpx 20rpx;
}

.filter-item {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;
  flex-wrap: wrap;
}

.filter-item.flex-end {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.filter-item.flex-end > view {
  flex: 1;
  display: flex;
  align-items: center;
}

.filter-item.flex-end > button {
  flex-shrink: 0;
}

/* 开关样式 */
switch {
  transform: scale(0.9);
}

/* 输入框样式 */
input {
  border: 3rpx solid #ddd;
  border-radius: 5rpx;
  padding: 0 10rpx;
  height: 50rpx;
  font-size: 28rpx;
  width: 250rpx;
}

.filter-label {
  width: 150rpx;
  font-size: 32rpx;
  color: #666;
  white-space: nowrap;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.time-picker {
  width: 120rpx;
  height: 50rpx;
  border: 1rpx solid #ddd;
  border-radius: 5rpx;
  padding: 0 10rpx;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
}

.time-range input {
  width: 120rpx;
  height: 50rpx;
  border: 1rpx solid #ddd;
  border-radius: 5rpx;
  padding: 0 10rpx;
  font-size: 24rpx;
}

.station-select {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  flex: 1;
}

.station-tag {
  background-color: #f0f0f0;
  padding: 8rpx 15rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  gap: 5rpx;
}

.station-tag.selected {
  background-color: #1E88E5;
  color: white;
}

.sort-select {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  flex: 1;
}

.sort-tag {
  background-color: #f0f0f0;
  padding: 8rpx 15rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
}

.sort-tag.selected {
  background-color: #1E88E5;
  color: white;
}

.tag-close {
  font-size: 28rpx;
  color: #999;
  margin-left: 5rpx;
}

.add-station {
  color: #1E88E5;
  font-size: 24rpx;
  padding: 8rpx 15rpx;
  border: 1rpx dashed #1E88E5;
  border-radius: 20rpx;
}

.reset-btn {
  width: 30%;
  height: 60rpx;
  background-color: #1E88E5;
  color: white;
  font-size: 32rpx;
  border-radius: 5rpx;
  margin-top: 0;
  margin-bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-placeholder {
  display: none;
}

.header-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-right: 20rpx;
}

.header-date {
  font-size: 28rpx;
  color: #666;
}

.train-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.train-item {
  background-color: white;
  border-radius: 10rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.train-info {
  margin-bottom: 20rpx;
}

.time-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.time-point {
  text-align: center;
  flex: 1;
}

.price-point {
  text-align: right;
  flex: 1.2;
  padding-left: 20rpx;
}

.time {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 5rpx;
}

.station {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.price {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #1E88E5;
  margin-bottom: 5rpx;
}

.arrow-line {
  flex: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  justify-content: center;
}

.lishi {
  font-size: 28rpx;
  color: #999;
  z-index: 1;
  background-color: white;
  padding: 0 10rpx;
  margin-bottom: 0rpx;
}

.arrow {
  width: 200rpx;
  height: 10rpx;
  margin: 5rpx 0;
  z-index: 1;
}

.train-code {
  font-size: 28rpx;
  color: #999;
  z-index: 1;
  background-color: white;
  padding: 0 10rpx;
  margin-top: 5rpx;
}

.seat-section {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10rpx;
}

.seat-item {
  padding: 5rpx;
  border: 2rpx solid #1E88E5;
  border-radius: 5rpx;
  text-align: center;
  position: relative;
}

.seat-item.no-ticket {
  border-color: #999;
  background-color: #f5f5f5;
}

.seat-name {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 5rpx;
}

.seat-count {
  display: block;
  font-size: 26rpx;
  font-weight: bold;
  color: #FF5722;
  margin-bottom: 5rpx;
}

.seat-count.no-ticket-text {
  color: #999;
}

.seat-price {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.empty-train {
  background-color: white;
  border-radius: 10rpx;
  padding: 50rpx;
  text-align: center;
  color: #999;
  font-size: 28rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}
</style>