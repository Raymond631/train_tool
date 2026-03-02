// 工具函数

// 格式化日期
export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 获取最近15天的日期数组
export const getRecent15Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 15; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(formatDate(date));
  }
  return days;
};

// 保存查询历史
export const saveSearchHistory = (historyItem) => {
  let history = uni.getStorageSync('searchHistory') || [];
  // 只保存车站信息，不保存日期
  const stationHistory = {
    from: historyItem.from,
    to: historyItem.to
  };
  // 移除重复项（只比较车站）
  history = history.filter(item => 
    !(item.from === stationHistory.from && 
      item.to === stationHistory.to)
  );
  // 添加到开头
  history.unshift(stationHistory);
  // 保留最近10条
  if (history.length > 10) {
    history = history.slice(0, 10);
  }
  uni.setStorageSync('searchHistory', history);
};

// 获取查询历史
export const getSearchHistory = () => {
  return uni.getStorageSync('searchHistory') || [];
};

// 清除查询历史
export const clearSearchHistory = () => {
  uni.removeStorageSync('searchHistory');
};

// 根据中文名称获取车站编码
export const getStationCode = (stationName) => {
  const stationMap = uni.getStorageSync('stationMap');
  if (stationMap) {
    return stationMap[stationName] || '';
  }
  return '';
};

// 解析余票数据
export const parseLeftTicketData = (data) => {
  if (!data || !data.data || !data.data.result) {
    return [];
  }
  
  return data.data.result.map(item => {
    const parts = item.split('|');
    return {
      secretStr: parts[0],
      buttonTextInfo: parts[1],
      train_no: parts[2],
      station_train_code: parts[3],
      start_station_telecode: parts[4],
      end_station_telecode: parts[5],
      from_station_telecode: parts[6],
      to_station_telecode: parts[7],
      start_time: parts[8],
      arrive_time: parts[9],
      lishi: parts[10],
      canWebBuy: parts[11],
      yp_info: parts[12],
      start_train_date: parts[13],
      train_seat_feature: parts[14],
      location_code: parts[15],
      from_station_no: parts[16],
      to_station_no: parts[17],
      is_support_card: parts[18],
      controlled_train_flag: parts[19],
      gg_num: parts[20],
      gr_num: parts[21],
      qt_num: parts[22],
      rw_num: parts[23],
      rz_num: parts[24],
      tz_num: parts[25],
      wz_num: parts[26],
      yb_num: parts[27],
      yw_num: parts[28],
      yz_num: parts[29],
      ze_num: parts[30],
      zy_num: parts[31],
      swz_num: parts[32],
      srrb_num: parts[33],
      yp_ex: parts[34],
      seat_types: parts[35],
      exchange_train_flag: parts[36],
      houbu_train_flag: parts[37],
      houbu_seat_limit: parts[38],
      yp_info_new: parts[39],
      dw_flag: parts[46],
      stopcheckTime: parts[48],
      country_flag: parts[49],
      local_arrive_time: parts[50],
      local_start_time: parts[51],
      bed_level_info: parts[53],
      seat_discount_info: parts[54],
      sale_time: parts[55]
    };
  });
};

// 解析价格码
export const bH = (dd) => {
  const de = {};
  const dc = Math.floor(dd.length / 10);
  for (let price = 0; price < dc; price++) {
    const db = dd.substring(price * 10, price * 10 + 10);
    const c8 = db[0];
    const da = db[6];
    const df = parseInt(db.substring(1, 6)) / 10;
    if (da === "3") {
      de["W"] = df;
    } else {
      de[c8] = df;
    }
  }
  return de;
};

// 获取价格数组
export const getPriceYp = (yp_info_new) => {
  const wu = 0;
  const price = [];
  const de = bH(yp_info_new);

  // 0.商务座/特等座
  if (de["9"] || de["P"]) {
    price.push(de["9"] || de["P"]);
  } else {
    price.push(wu);
  }

  // 1.一等座
  price.push(de["M"] || wu);

  // 2.二等座/二等包座
  if (de["O"] || de["S"]) {
    price.push(de["O"] || de["S"]);
  } else {
    price.push(wu);
  }

  // 3.高级软卧
  if (de["6"] || de["A"]) {
    price.push(de["6"] || de["A"]);
  } else {
    price.push(wu);
  }

  // 4.软卧/一等卧
  if (de["4"] || de["I"]) {
    price.push(de["4"] || de["I"]);
  } else {
    price.push(wu);
  }

  // 5.动卧
  price.push(de["F"] || wu);

  // 6.硬卧/二等卧
  if (de["3"] || de["J"]) {
    price.push(de["3"] || de["J"]);
  } else {
    price.push(wu);
  }

  // 7.软座
  price.push(de["2"] || wu);

  // 8.硬座
  price.push(de["1"] || wu);

  // 9.无座
  price.push(de["W"] || wu);

  // 10.其他
  if (de["5"] || de["D"] || de["E"] || de["G"] || de["H"] || de["Q"]) {
    price.push(de["5"] || de["D"] || de["E"] || de["G"] || de["H"] || de["Q"] || "");
  } else {
    price.push(wu);
  }

  return price;
};

// 排序席位：价格便宜的放前面
export const sortedSeats = (train) => {
  const seats = [];
  // 获取价格数组
  const prices = train.yp_info_new ? getPriceYp(train.yp_info_new) : [];
  
  // 商务座
  const swzPrice = prices[0] || 0;
  if (swzPrice > 0) {
    seats.push({
      type: 'swz',
      name: '商务座',
      count: train.swz_num && train.swz_num !== '无' && train.swz_num !== '' ? 
        (train.swz_num === '有' ? '有票' : `${train.swz_num}张`) : '无',
      price: swzPrice,
      available: train.swz_num && train.swz_num !== '无' && train.swz_num !== ''
    });
  }
  
  // 特等座
  const tzPrice = prices[0] || 0; // 特等座和商务座价格相同
  if (tzPrice > 0 && train.tz_num) {
    seats.push({
      type: 'tz',
      name: '特等座',
      count: train.tz_num && train.tz_num !== '无' && train.tz_num !== '' ? 
        (train.tz_num === '有' ? '有票' : `${train.tz_num}张`) : '无',
      price: tzPrice,
      available: train.tz_num && train.tz_num !== '无' && train.tz_num !== ''
    });
  }
  
  // 一等座
  const zyPrice = prices[1] || 0;
  if (zyPrice > 0) {
    seats.push({
      type: 'zy',
      name: '一等座',
      count: train.zy_num && train.zy_num !== '无' && train.zy_num !== '' ? 
        (train.zy_num === '有' ? '有票' : `${train.zy_num}张`) : '无',
      price: zyPrice,
      available: train.zy_num && train.zy_num !== '无' && train.zy_num !== ''
    });
  }
  
  // 二等座
  const zePrice = prices[2] || 0;
  if (zePrice > 0) {
    seats.push({
      type: 'ze',
      name: '二等座',
      count: train.ze_num && train.ze_num !== '无' && train.ze_num !== '' ? 
        (train.ze_num === '有' ? '有票' : `${train.ze_num}张`) : '无',
      price: zePrice,
      available: train.ze_num && train.ze_num !== '无' && train.ze_num !== ''
    });
  }
  
  // 高级软卧
  const grPrice = prices[3] || 0;
  if (grPrice > 0) {
    seats.push({
      type: 'gr',
      name: '高级软卧',
      count: train.gr_num && train.gr_num !== '无' && train.gr_num !== '' ? 
        (train.gr_num === '有' ? '有票' : `${train.gr_num}张`) : '无',
      price: grPrice,
      available: train.gr_num && train.gr_num !== '无' && train.gr_num !== ''
    });
  }
  
  // 软卧
  const rwPrice = prices[4] || 0;
  if (rwPrice > 0) {
    seats.push({
      type: 'rw',
      name: '软卧',
      count: train.rw_num && train.rw_num !== '无' && train.rw_num !== '' ? 
        (train.rw_num === '有' ? '有票' : `${train.rw_num}张`) : '无',
      price: rwPrice,
      available: train.rw_num && train.rw_num !== '无' && train.rw_num !== ''
    });
  }
  
  // 一等卧
  const ybPrice = prices[4] || 0; // 一等卧和软卧价格相同
  if (ybPrice > 0 && train.yb_num) {
    seats.push({
      type: 'yb',
      name: '一等卧',
      count: train.yb_num && train.yb_num !== '无' && train.yb_num !== '' ? 
        (train.yb_num === '有' ? '有票' : `${train.yb_num}张`) : '无',
      price: ybPrice,
      available: train.yb_num && train.yb_num !== '无' && train.yb_num !== ''
    });
  }
  
  // 动卧
  const srrbPrice = prices[5] || 0;
  if (srrbPrice > 0) {
    seats.push({
      type: 'srrb',
      name: '动卧',
      count: train.srrb_num && train.srrb_num !== '无' && train.srrb_num !== '' ? 
        (train.srrb_num === '有' ? '有票' : `${train.srrb_num}张`) : '无',
      price: srrbPrice,
      available: train.srrb_num && train.srrb_num !== '无' && train.srrb_num !== ''
    });
  }
  
  // 硬卧
  const ywPrice = prices[6] || 0;
  if (ywPrice > 0) {
    seats.push({
      type: 'yw',
      name: '硬卧',
      count: train.yw_num && train.yw_num !== '无' && train.yw_num !== '' ? 
        (train.yw_num === '有' ? '有票' : `${train.yw_num}张`) : '无',
      price: ywPrice,
      available: train.yw_num && train.yw_num !== '无' && train.yw_num !== ''
    });
  }
  
  // 二等卧
  const edwPrice = prices[6] || 0; // 二等卧和硬卧价格相同
  if (edwPrice > 0 && train.edw_num) {
    seats.push({
      type: 'edw',
      name: '二等卧',
      count: train.edw_num && train.edw_num !== '无' && train.edw_num !== '' ? 
        (train.edw_num === '有' ? '有票' : `${train.edw_num}张`) : '无',
      price: edwPrice,
      available: train.edw_num && train.edw_num !== '无' && train.edw_num !== ''
    });
  }
  
  // 软座
  const rzPrice = prices[7] || 0;
  if (rzPrice > 0) {
    seats.push({
      type: 'rz',
      name: '软座',
      count: train.rz_num && train.rz_num !== '无' && train.rz_num !== '' ? 
        (train.rz_num === '有' ? '有票' : `${train.rz_num}张`) : '无',
      price: rzPrice,
      available: train.rz_num && train.rz_num !== '无' && train.rz_num !== ''
    });
  }
  
  // 硬座
  const yzPrice = prices[8] || 0;
  if (yzPrice > 0) {
    seats.push({
      type: 'yz',
      name: '硬座',
      count: train.yz_num && train.yz_num !== '无' && train.yz_num !== '' ? 
        (train.yz_num === '有' ? '有票' : `${train.yz_num}张`) : '无',
      price: yzPrice,
      available: train.yz_num && train.yz_num !== '无' && train.yz_num !== ''
    });
  }
  
  // 无座
  const wzPrice = prices[9] || 0;
  if (wzPrice > 0) {
    seats.push({
      type: 'wz',
      name: '无座',
      count: train.wz_num && train.wz_num !== '无' && train.wz_num !== '' ? 
        (train.wz_num === '有' ? '有票' : `${train.wz_num}张`) : '无',
      price: wzPrice,
      available: train.wz_num && train.wz_num !== '无' && train.wz_num !== ''
    });
  }
  
  // 其他
  const qtPrice = prices[10] || 0;
  if (qtPrice > 0) {
    seats.push({
      type: 'qt',
      name: '其他',
      count: train.qt_num && train.qt_num !== '无' && train.qt_num !== '' ? 
        (train.qt_num === '有' ? '有票' : `${train.qt_num}张`) : '无',
      price: qtPrice,
      available: train.qt_num && train.qt_num !== '无' && train.qt_num !== ''
    });
  }
  
  // 按价格排序
  return seats.sort((a, b) => a.price - b.price);
}