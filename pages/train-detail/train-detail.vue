<template>
  <!-- 固定在顶部的部分 -->
  <view class="fixed-top">
    <!-- 车次信息 -->
    <view class="train-info">
      <view class="train-info-row">
        <text class="train-code">{{ trainCode }}</text>
        <text class="train-route">{{ fromName }} → {{ toName }}</text>
      </view>
      <view class="train-info-row">
        <text class="train-time">{{ startTime }} - {{ arriveTime }}</text>
        <text class="train-lishi">历时 {{ lishi }}</text>
      </view>
    </view>
    
    <!-- 时刻表 -->
    <view class="schedule-section">
      <text class="section-title">时刻表</text>
      <view class="schedule-container">
        <view class="station-list">
          <view 
            v-for="(station, index) in schedule" 
            :key="station.station_no"
            class="station-item"
            :class="{ 'current-station': isCurrentStation(station) }"
          >
            <text class="station-name">{{ station.station_name }}</text>
            <view class="time-info">
              <text class="station-time">{{ station.arrive_time === '----' ? '' : station.arrive_time }} /</text>
              <text class="station-time">{{ station.start_time === '----' ? '' : station.start_time }}</text>
            </view>
            <text class="stopover-time">{{ station.stopover_time === '----' ? '' : station.stopover_time }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 购票方案标题和Tab -->
    <view class="ticket-header">
      <text class="section-title">购票方案</text>
      <view class="tab-container">
        <view 
          class="tab-item" 
          :class="{ 'active': activeTab === 'original' }"
          @click="activeTab = 'original'"
        >
          原始方案
        </view>
        <view 
          class="tab-item" 
          :class="{ 'active': activeTab === 'noSupplement' }"
          @click="activeTab = 'noSupplement'"
        >
          多买几站
        </view>
        <view 
          class="tab-item" 
          :class="{ 'active': activeTab === 'supplement' }"
          @click="activeTab = 'supplement'"
        >
          上车补票
        </view>
      </view>
    </view>
  </view>
  
  <!-- 可滚动的部分 -->
  <view class="scroll-container">
    <scroll-view class="container" scroll-y="true" style="height: 100%;">
      <!-- 购票方案内容 -->
      <view class="ticket-content">
      <!-- 原始方案 -->
      <view v-if="activeTab === 'original'" class="plan-section">
        <view class="ticket-plans">
          <view 
            v-for="(plan, index) in originalPlans" 
            :key="index"
            class="ticket-plan-item"
          >
            <view class="plan-header-horizontal">
              <view class="plan-stations">
                <text :class="{ 'blue-station': plan.isBuyFrom }">{{ plan.buyFrom }}</text>
                <text class="arrow">→</text>
                <text :class="{ 'blue-station': plan.isBuyTo }">{{ plan.buyTo }}</text>
              </view>
              <text class="plan-title">{{ plan.title }}</text>
            </view>
            <!-- 余票信息 -->
            <view class="ticket-info" v-if="getPlanSeats(plan).length > 0">
              <view class="seat-section">
                <view 
                  v-for="(seat, seatIndex) in getPlanSeats(plan)" 
                  :key="seatIndex"
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
            <view class="ticket-info" v-else>
              <text class="no-ticket-msg">暂无余票信息</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 不要补票的 -->
      <view v-if="activeTab === 'noSupplement'" class="plan-section">
        <view class="ticket-plans">
          <view 
            v-for="(plan, index) in noSupplementPlans" 
            :key="index"
            class="ticket-plan-item"
          >
            <view class="plan-header-horizontal">
              <view class="plan-stations">
                <text :class="{ 'blue-station': plan.isBuyFrom }">{{ plan.buyFrom }}</text>
                <text class="arrow">→</text>
                <text :class="{ 'blue-station': plan.isBuyTo }">{{ plan.buyTo }}</text>
              </view>
              <text class="plan-title">{{ plan.title }}</text>
            </view>
            <!-- 余票信息 -->
            <view class="ticket-info" v-if="getPlanSeats(plan).length > 0">
              <view class="seat-section">
                <view 
                  v-for="(seat, seatIndex) in getPlanSeats(plan)" 
                  :key="seatIndex"
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
            <view class="ticket-info" v-else>
              <text class="no-ticket-msg">暂无余票信息</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 要补票的 -->
      <view v-if="activeTab === 'supplement'" class="plan-section">
        <view class="ticket-plans">
          <view 
            v-for="(plan, index) in supplementPlans" 
            :key="index"
            class="ticket-plan-item"
          >
            <view class="plan-header-horizontal">
              <view class="plan-stations">
                <text :class="{ 'blue-station': plan.isBuyFrom }">{{ plan.buyFrom }}</text>
                <text class="arrow">→</text>
                <text :class="{ 'blue-station': plan.isBuyTo }">{{ plan.buyTo }}</text>
              </view>
              <text class="plan-title">{{ plan.title }}</text>
            </view>
            <!-- 余票信息 -->
            <view class="ticket-info" v-if="getPlanSeats(plan).length > 0">
              <view class="seat-section">
                <view 
                  v-for="(seat, seatIndex) in getPlanSeats(plan)" 
                  :key="seatIndex"
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
            <view class="ticket-info" v-else>
              <text class="no-ticket-msg">暂无余票信息</text>
            </view>
          </view>
        </view>
      </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { queryTrainSchedule, queryLeftTicket, getStationData } from '../../utils/api';
import { parseLeftTicketData, getStationCode,sortedSeats } from '../../utils/utils';

export default {
  data() {
    return {
      trainNo: '',
      fromStation: '',
      toStation: '',
      date: '',
      trainCode: '',
      fromName: '',
      toName: '',
      startTime: '',
      arriveTime: '',
      lishi: '',
      schedule: [],
      fromStationNo: '',
      toStationNo: '',
      ticketPlans: [],
      activeTab: 'original', // 默认选中原始方案tab
      ticketInfo: {}, // 存储各个方案的余票信息
      isQuerying: false // 标记是否正在查询余票
    };
  },
  computed: {
    // 原始方案
    originalPlans() {
      return this.ticketPlans.filter(plan => plan.title === '原始方案');
    },
    // 不要补票的方案
    noSupplementPlans() {
      return this.ticketPlans.filter(plan => {
        return (plan.title.includes('往前多买') || plan.title.includes('往后多买')) && !plan.title.includes('上车补票');
      }).sort((a, b) => {
        // 首先按多买的站数排序
        if (a.extraStations !== b.extraStations) {
          return a.extraStations - b.extraStations;
        }
        // 站数相同按类型排序：forward < backward < both
        const typeOrder = { 'forward': 0, 'backward': 1, 'both': 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      });
    },
    // 要补票的方案
    supplementPlans() {
      return this.ticketPlans.filter(plan => {
        return plan.title.includes('少买') || plan.title.includes('上车补票');
      });
    }
  },
  onLoad(options) {
    // 接收传递的参数
    this.trainNo = options.train_no;
    this.fromStation = options.from_station;
    this.toStation = options.to_station;
    this.date = options.date;
    this.trainCode = options.train_code;
    this.fromName = options.from_name;
    this.toName = options.to_name;
    this.startTime = options.start_time;
    this.arriveTime = options.arrive_time;
    this.lishi = options.lishi;
    
    // 查询时刻表
    this.loadSchedule();
  },
  onUnload() {
    // 页面卸载时停止余票查询
    this.isQuerying = false;
    console.log('页面卸载，停止余票查询');
  },
  watch: {
    activeTab: {
      handler(newTab, oldTab) {
        // 切换tab时停止当前查询
        this.isQuerying = false;
        console.log('切换tab，停止当前查询');
        
        // 延迟一小段时间后开始查询新tab的余票
        setTimeout(() => {
          this.isQuerying = true;
          this.getTicketInfo();
        }, 1000);
      },
      immediate: true // 初始加载时也执行一次
    }
  },
  methods: {
    // 获取时刻表
    async loadSchedule() {
      uni.showLoading({
        title: '加载中...'
      });
      
      const result = await queryTrainSchedule(this.trainNo, this.fromStation, this.toStation, this.date);
      uni.hideLoading();
      
      if (result && result.data && result.data.data) {
        this.schedule = result.data.data;
        // 找出出发站和到达站的station_no
        // 使用station_name来查找，因为响应中没有station_telecode
        const fromStation = this.schedule.find(station => station.station_name === this.fromName);
        const toStation = this.schedule.find(station => station.station_name === this.toName);
        if (fromStation) this.fromStationNo = fromStation.station_no;
        if (toStation) this.toStationNo = toStation.station_no;
        
        // 计算购票方案
        this.calculateTicketPlans();
      }
    },
    // 判断是否为途径站
    isCurrentStation(station) {
      // 突出显示实际乘坐的区间站点
      if (!this.fromStationNo || !this.toStationNo) return false;
      const stationNo = parseInt(station.station_no);
      const fromNo = parseInt(this.fromStationNo);
      const toNo = parseInt(this.toStationNo);
      return stationNo >= fromNo && stationNo <= toNo;
    },
    // 计算购票方案
    calculateTicketPlans() {
      if (this.schedule.length === 0 || !this.fromStationNo || !this.toStationNo) {
        this.ticketPlans = [];
        return;
      }
      
      const fromIndex = this.schedule.findIndex(station => station.station_no === this.fromStationNo);
      const toIndex = this.schedule.findIndex(station => station.station_no === this.toStationNo);
      
      if (fromIndex === -1 || toIndex === -1) {
        this.ticketPlans = [];
        return;
      }
      
      const plans = [];
      
      // 1. 原始方案
      plans.push({
        title: '原始方案',
        buyFrom: this.fromName,
        boardFrom: this.fromName,
        buyTo: this.toName,
        getOffTo: this.toName,
        isBuyFrom: true,
        isBuyTo: true
      });
      
      // 2. 往前多买x站
      for (let x = 1; x <= fromIndex; x++) {
        const buyFromIndex = fromIndex - x;
        plans.push({
          title: `往前多买${x}站`,
          buyFrom: this.schedule[buyFromIndex].station_name,
          boardFrom: this.fromName,
          buyTo: this.toName,
          getOffTo: this.toName,
          isBuyFrom: true,
          isBuyTo: true,
          extraStations: x, // 多买的站数
          type: 'forward' // 类型：往前多买
        });
      }
      
      // 3. 往后多买y站
      for (let y = 1; y <= this.schedule.length - 1 - toIndex; y++) {
        const buyToIndex = toIndex + y;
        plans.push({
          title: `往后多买${y}站`,
          buyFrom: this.fromName,
          boardFrom: this.fromName,
          buyTo: this.schedule[buyToIndex].station_name,
          getOffTo: this.toName,
          isBuyFrom: true,
          isBuyTo: true,
          extraStations: y, // 多买的站数
          type: 'backward' // 类型：往后多买
        });
      }
      
      // 4. 往前多买x站，并往后多买y站
      for (let x = 1; x <= fromIndex; x++) {
        for (let y = 1; y <= this.schedule.length - 1 - toIndex; y++) {
          const buyFromIndex = fromIndex - x;
          const buyToIndex = toIndex + y;
          plans.push({
            title: `往前多买${x}站，并往后多买${y}站`,
            buyFrom: this.schedule[buyFromIndex].station_name,
            boardFrom: this.fromName,
            buyTo: this.schedule[buyToIndex].station_name,
            getOffTo: this.toName,
            isBuyFrom: true,
            isBuyTo: true,
            extraStations: x + y, // 多买的站数
            type: 'both' // 类型：往前和往后多买
          });
        }
      }
      
      // 5. 上车补票y站（从购票起点补票到终点）
      for (let y = 1; y < toIndex - fromIndex; y++) {
        const buyToIndex = fromIndex + y;
        if (buyToIndex < toIndex) {
          plans.push({
            title: `上车补票${y}站`,
            buyFrom: this.fromName,
            boardFrom: this.fromName,
            buyTo: this.schedule[buyToIndex].station_name,
            getOffTo: this.toName,
            isBuyFrom: true,
            isBuyTo: true
          });
        }
      }
      
      // 6. 往前多买x站，并上车补票y站
      for (let x = 1; x <= fromIndex; x++) {
        for (let y = 1; y < toIndex - fromIndex; y++) {
          const buyFromIndex = fromIndex - x;
          const buyToIndex = fromIndex + y;
          if (buyToIndex < toIndex) {
            plans.push({
              title: `往前多买${x}站，并上车补票${y}站`,
              buyFrom: this.schedule[buyFromIndex].station_name,
              boardFrom: this.fromName,
              buyTo: this.schedule[buyToIndex].station_name,
              getOffTo: this.toName,
              isBuyFrom: true,
              isBuyTo: true
            });
          }
        }
      }
      
      this.ticketPlans = plans;
    },
    // 加载车站数据
    async loadStationData() {
      const stationMap = uni.getStorageSync('stationMap');
      const expire = uni.getStorageSync('stationExpire');
      if (!stationMap || !expire || Date.now() > expire) {
        // 从API获取车站数据
        await getStationData();
      }
    },
    // 获取余票信息
    async getTicketInfo() {
      // 确保车站数据已加载
      await this.loadStationData();
      
      // 根据当前tab选择要查询的方案
      let queryPlans = [];
      switch (this.activeTab) {
        case 'original':
          queryPlans = this.originalPlans;
          break;
        case 'noSupplement':
          queryPlans = this.noSupplementPlans;
          break;
        case 'supplement':
          queryPlans = this.supplementPlans;
          break;
        default:
          queryPlans = [];
      }
      
      console.log(`开始查询${this.activeTab}的余票信息，共${queryPlans.length}个方案`);
      
      // 按顺序调用queryLeftTicket
      for (let i = 0; i < queryPlans.length; i++) {
        // 检查是否需要停止查询
        if (!this.isQuerying) {
          console.log('停止余票查询');
          break;
        }
        
        const plan = queryPlans[i];
        // 获取购票起点和终点的编码
        const fromCode = getStationCode(plan.buyFrom);
        const toCode = getStationCode(plan.buyTo);
        if (fromCode && toCode) {
          try {
            // 调用queryLeftTicket
            const result = await queryLeftTicket(this.date, fromCode, toCode);
            
            // 再次检查是否需要停止查询
            if (!this.isQuerying) {
              console.log('停止余票查询');
              break;
            }
            
            if (result && result.data && result.data.result) {
              // 解析余票数据
              const tickets = parseLeftTicketData(result);
              // 筛选本车次
              const trainTicket = tickets.find(ticket => ticket.station_train_code === this.trainCode);
              
              if (trainTicket) {
                // 存储余票信息
                this.ticketInfo[`${plan.buyFrom}_${plan.buyTo}`] = trainTicket;
              }
            }
          } catch (error) {
            console.error('获取余票信息失败:', error);
          }
          
          // 随机sleep
          const sleepTime = Math.floor(Math.random() * 1000) + 500;
          await new Promise(resolve => setTimeout(resolve, sleepTime));
        }
      }
      
      console.log(`${this.activeTab}的余票查询完成`);
    },
    // 获取方案的席位信息
    getPlanSeats(plan) {
      const ticketInfo = this.ticketInfo[`${plan.buyFrom}_${plan.buyTo}`] || null;
      if (!ticketInfo) return [];
      return sortedSeats(ticketInfo);
    },
  }
};
</script>

<style>
.scroll-container {
  position: fixed;
  top: 550rpx;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
}

.container {
  padding: 0 20rpx 20rpx;
  background-color: #f5f5f5;
  min-height: 100%;
}

.fixed-top {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: white;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.train-info {
  padding: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.train-info-row {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.schedule-section {
  padding: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  max-height: 200rpx;
  overflow-y: auto;
}

.ticket-header {
  padding: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.train-code {
  font-size: 36rpx;
  font-weight: bold;
  color: #1E88E5;
  margin-right: 20rpx;
}

.train-time {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-right: 20rpx;
}

.train-lishi {
  font-size: 24rpx;
  color: #666;
}

.train-route {
  font-size: 28rpx;
  color: #333;
  flex: 1;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.schedule-container {
  overflow-x: auto;
  padding-top: 20rpx;
  padding-bottom: 20rpx;
}

.station-list {
  display: flex;
  align-items: flex-start;
  min-width: max-content;
}

.station-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 120rpx;
  margin-right: 40rpx;
}

.station-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
  text-align: left;
}

.station-item.current-station .station-name {
  color: #1E88E5;
}

.time-info {
  display: flex;
  flex-direction: column;
  margin-bottom: 10rpx;
}

.station-time {
  font-size: 24rpx;
  color: #666;
  text-align: left;
  line-height: 1.3;
}

.station-item.current-station .station-time {
  color: #1E88E5;
}

.stopover-time {
  font-size: 20rpx;
  color: #999;
  text-align: left;
}

.ticket-content {
  background-color: white;
  border-radius: 10rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  padding: 0 0 20rpx;
  margin-top: 20rpx;
}

.tab-container {
  display: flex;
  margin-top: 15rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 15rpx 0;
  font-size: 28rpx;
  color: #666;
  cursor: pointer;
  position: relative;
}

.tab-item.active {
  color: #1E88E5;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1rpx;
  left: 0;
  right: 0;
  height: 3rpx;
  background-color: #1E88E5;
}

.plan-section {
  background-color: #f9f9f9;
  border-radius: 10rpx;
  padding: 20rpx;
  box-shadow: 0 1rpx 5rpx rgba(0, 0, 0, 0.05);
  margin: 20rpx 0 0;
}

.section-subtitle {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
  padding-bottom: 10rpx;
  border-bottom: 1rpx solid #e0e0e0;
}

.ticket-plans {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.ticket-plan-item {
  border: 1rpx solid #f0f0f0;
  border-radius: 5rpx;
  padding: 15rpx;
  background-color: #f9f9f9;
}

.plan-header {
  margin-bottom: 10rpx;
  padding-bottom: 10rpx;
  border-bottom: 1rpx solid #e0e0e0;
}

.plan-header-horizontal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5rpx;
  padding-bottom: 10rpx;
  border-bottom: 1rpx solid #e0e0e0;
}

.plan-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.plan-stations {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10rpx;
  font-size: 28rpx;
  flex: 1;
}

.plan-content {
  margin-top: 10rpx;
}

.blue-station {
  color: #1E88E5;
  font-weight: bold;
}

.station {
  color: #333;
}

.arrow {
  color: #999;
  margin: 0 5rpx;
}

.ticket-info {
  margin-top: 5rpx;
  padding-top: 5rpx;
}

.ticket-info-title {
  font-size: 24rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
  display: block;
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

.no-ticket-msg {
  font-size: 24rpx;
  color: #999;
  text-align: center;
  padding: 20rpx 0;
}
</style>