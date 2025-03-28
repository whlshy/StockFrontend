import React, { useRef, useEffect } from 'react';
import { createChart, LineSeries, CandlestickSeries, AreaSeries, HistogramSeries } from 'lightweight-charts'

const minimumWidth = 80

const StockChart = ({ candlestickData, volumeData }) => {
  const chartContainerRef = useRef();
  const [width, setWidth] = React.useState(null)

  const chartOptions = {
    width: width,
    layout: {
      backgroundColor: '#fff',
      textColor: '#000',
    },
    timeScale: {
      borderColor: '#eee',
      visible: false,
    },
    rightPriceScale: {
      minimumWidth,
      maximumWidth: 65,
      borderVisible: true
    },
  }
  

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      let width = entries[0].contentRect.width
      setWidth(width)
    })
    observer.observe(chartContainerRef.current)
    return () => chartContainerRef.current && observer.unobserve(chartContainerRef.current)
  }, [])

  useEffect(() => {

    // 初始化圖表
    const chart = (createChart(chartContainerRef.current, {
      ...chartOptions,
      height: 400,
      rightPriceScale: {
        minimumWidth,
        borderVisible: true
      },
    }))

    chart.applyOptions({
      crosshair: {
        // Change mode from default 'magnet' to 'normal'.
        // Allows the crosshair to move freely without snapping to datapoints
        mode: 0,
      },
    });

    // 添加 K 棒圖系列
    const candleSeries = createCandleSeries(chart)

    const chart2 = (createChart(chartContainerRef.current, {
      ...chartOptions,
      width: width,
      height: 120,
      timeScale: {
        borderColor: '#eee',
        visible: true,
      },
    }))

    // 添加成交量系列（直方圖）
    const volumeSeries = chart2.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      // priceScaleId: '',
    });
    volumeSeries.setData(volumeData);

    // 調整價格尺度，防止成交量與 K 棒圖重疊
    // chart2.priceScale('').applyOptions({
    //   scaleMargins: { top: 0.8, bottom: 0 },
    // });

    chart.timeScale().subscribeVisibleLogicalRangeChange(timeRange => {
      chart2.timeScale().setVisibleLogicalRange(timeRange);
    });

    chart2.timeScale().subscribeVisibleLogicalRangeChange(timeRange => {
      chart.timeScale().setVisibleLogicalRange(timeRange);
    });

    function getCrosshairDataPoint(series, param) {
      if (!param.time) {
        return null;
      }
      const dataPoint = param.seriesData.get(series);
      return dataPoint || null;
    }

    function syncCrosshair(chart, series, dataPoint) {
      if (dataPoint) {
        chart.setCrosshairPosition(dataPoint.value, dataPoint.time, series);
        return;
      }
      chart.clearCrosshairPosition();
    }
    chart.subscribeCrosshairMove(param => {
      const dataPoint = getCrosshairDataPoint(candleSeries, param);
      syncCrosshair(chart2, volumeSeries, dataPoint);
    });
    chart2.subscribeCrosshairMove(param => {
      const dataPoint = getCrosshairDataPoint(volumeSeries, param);
      syncCrosshair(chart, candleSeries, dataPoint);
    });

    // 當元件卸載時清理圖表
    return () => {
      chart?.remove()
      chart2?.remove()
    };
  }, [candlestickData, volumeData, width]);

  const createCandleSeries = (chart) => {
    const candleSeries = chart.addSeries(CandlestickSeries);
    candleSeries.setData(candlestickData);
    candleSeries.applyOptions({
      wickUpColor: 'red',
      upColor: 'red',
      wickDownColor: 'green',
      downColor: 'green',
      borderVisible: false,
    });

    return candleSeries
  }

  return <div ref={chartContainerRef} className='w-full' />;
};

export default StockChart;