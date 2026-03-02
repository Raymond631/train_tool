// 网络请求封装
const baseUrl = 'https://kyfw.12306.cn';

// 通用请求头
const headers = {
  'Accept': '*/*',
  'Accept-Language': 'zh-CN,zh;q=0.9',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'DNT': '1',
  'Pragma': 'no-cache',
  'Host': 'kyfw.12306.cn',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-ch-ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"'
};

// 获取cookie（优先使用缓存的cookie，如果缓存失效则从服务器获取）
export const getCookie = async () => {
  // 先检查是否有缓存的有效cookie
  const cachedCookie = uni.getStorageSync('cookie');
  const expire = uni.getStorageSync('cookieExpire');
  if (cachedCookie && expire && Date.now() < expire) {
    return cachedCookie;
  }
  
  // 缓存失效，从服务器获取新的cookie
  try {
    const response = await uni.request({
      url: `${baseUrl}/otn/login/init`,
      method: 'GET',
      header: {
        ...headers,
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    // 提取cookie
    const cookies = response.header['Set-Cookie'] || response.header['set-cookie'];
    if (cookies) {
      const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      // 缓存cookie，有效期12小时
      uni.setStorageSync('cookie', cookieString);
      uni.setStorageSync('cookieExpire', Date.now() + 12 * 60 * 60 * 1000);
      return cookieString;
    }
    return '';
  } catch (error) {
    console.error('获取cookie失败:', error);
    return '';
  }
};

// 查询车站编码（优先使用缓存的车站数据，如果缓存失效则从服务器获取）
export const getStationData = async () => {
  // 先检查是否有缓存的有效车站数据
  const cachedStationMap = uni.getStorageSync('stationMap');
  const expire = uni.getStorageSync('stationExpire');
  if (cachedStationMap && expire && Date.now() < expire) {
    return cachedStationMap;
  }
  
  // 缓存失效，从服务器获取新的车站数据
  try {
    const response = await uni.request({
      url: `${baseUrl}/otn/resources/js/framework/station_name.js`,
      method: 'GET',
      header: headers
    });
    
    if (response.statusCode === 200) {
      const data = response.data;
      // 解析车站数据
      const stationMap = {};
      const stationArray = data.split('@').filter(item => item);
      stationArray.forEach(item => {
        const parts = item.split('|');
        if (parts.length > 1) {
          stationMap[parts[1]] = parts[2]; // 中文名称 -> 编码
        }
      });
      
      // 缓存车站数据，有效期7天
      uni.setStorageSync('stationMap', stationMap);
      uni.setStorageSync('stationExpire', Date.now() + 7 * 24 * 60 * 60 * 1000);
      return stationMap;
    }
    return {};
  } catch (error) {
    console.error('获取车站数据失败:', error);
    return {};
  }
};

// 查询余票
export const queryLeftTicket = async (trainDate, fromStation, toStation) => {
  console.log('查询余票参数:', trainDate, fromStation, toStation);
  try {
    // 生成缓存键
    const cacheKey = `ticket_${trainDate}_${fromStation}_${toStation}`;
    
    // 检查缓存
    const cachedData = uni.getStorageSync(cacheKey);
    const cacheExpire = uni.getStorageSync(`${cacheKey}_expire`);
    
    if (cachedData && cacheExpire && Date.now() < cacheExpire) {
      console.log('命中余票缓存', cacheKey);
      return cachedData;
    }
    
    // 确保有cookie
    const cookie = await getCookie();
    const requestHeader = {
      ...headers,
      'If-Modified-Since': '0',
      'Pragma': 'no-cache',
      'Referer': `${baseUrl}/otn/leftTicket/init`,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': cookie
    };
    
    const requestData = {
      "leftTicketDTO.train_date": trainDate,
      "leftTicketDTO.from_station": fromStation,
      "leftTicketDTO.to_station": toStation,
      "purpose_codes": "ADULT" // 成人票
    };
    const response = await uni.request({
      url: `${baseUrl}/otn/leftTicket/queryG`,
      method: 'GET',
      header: requestHeader,
      data: requestData
    });
	
	
    
    if (response.statusCode === 200) {
      // 缓存数据，有效期1分钟
      uni.setStorageSync(cacheKey, response.data);
      uni.setStorageSync(`${cacheKey}_expire`, Date.now() + 60 * 1000);
      console.log('未命中余票缓存, 接口返回结果:', response.data);
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('查询余票失败:', error);
    return null;
  }
};

// 查询时刻表
export const queryTrainSchedule = async (trainNo, fromStation, toStation, departDate) => {
  console.log('查询时刻表参数:', trainNo, fromStation, toStation, departDate);
  try {
    // 生成缓存键
    const cacheKey = `schedule_${trainNo}_${fromStation}_${toStation}_${departDate}`;
    
    // 检查缓存
    const cachedData = uni.getStorageSync(cacheKey);
    const cacheExpire = uni.getStorageSync(`${cacheKey}_expire`);
    
    if (cachedData && cacheExpire && Date.now() < cacheExpire) {
      console.log('命中时刻表缓存', cacheKey);
      return cachedData;
    }
    
    // 确保有cookie
    const cookie = await getCookie();
    
    const response = await uni.request({
      url: `${baseUrl}/otn/czxx/queryByTrainNo`,
      method: 'GET',
      header: {
        ...headers,
        'If-Modified-Since': '0',
        'Pragma': 'no-cache',
        'Referer': `${baseUrl}/otn/leftTicket/init`,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': cookie
      },
      data: {
        train_no: trainNo,
        from_station_telecode: fromStation,
        to_station_telecode: toStation,
        depart_date: departDate
      }
    });
    
    if (response.statusCode === 200) {
      // 缓存数据，有效期24小时
      uni.setStorageSync(cacheKey, response.data);
      uni.setStorageSync(`${cacheKey}_expire`, Date.now() + 24 * 60 * 60 * 1000);
      console.log('未命中时刻表缓存, 接口返回结果:', response.data);
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('查询时刻表失败:', error);
    return null;
  }
};