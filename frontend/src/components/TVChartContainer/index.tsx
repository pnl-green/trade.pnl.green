import { useEffect, useRef } from 'react';
import {
  ChartingLibraryWidgetOptions,
  LanguageCode,
  ResolutionString,
  widget,
} from '@/public/static/charting_library/charting_library';
import { UDFCompatibleDatafeed } from '@/public/static/datafeeds/udf/types';
import { ChartSelectionMode } from '@/context/chartInteractionContext';
import styles from './index.module.css';

type TVChartContainerProps = Partial<ChartingLibraryWidgetOptions> & {
  selectionMode?: ChartSelectionMode;
  onPriceFromChart?: (price: number) => void;
};

export const TVChartContainer = ({
  selectionMode = 'none',
  onPriceFromChart,
  ...widgetProps
}: TVChartContainerProps) => {
  const chartContainerRef =
    useRef<HTMLDivElement>() as React.MutableRefObject<HTMLInputElement>;
  const selectionModeRef = useRef<ChartSelectionMode>(selectionMode);

  useEffect(() => {
    selectionModeRef.current = selectionMode ?? 'none';
  }, [selectionMode]);

  useEffect(() => {
    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: widgetProps.symbol,
      datafeed: widgetProps.datafeed as UDFCompatibleDatafeed,
      interval: widgetProps.interval as ResolutionString,
      container: chartContainerRef.current,
      library_path: widgetProps.library_path,
      locale: widgetProps.locale as LanguageCode,
      disabled_features: [
        'use_localstorage_for_settings',
        'header_symbol_search',
        'symbol_search_hot_key',
        'header_compare',
        'go_to_date',
      ],
      enabled_features: ['hide_resolution_in_legend'],
      charts_storage_url: widgetProps.charts_storage_url,
      charts_storage_api_version: widgetProps.charts_storage_api_version,
      client_id: widgetProps.client_id,
      user_id: widgetProps.user_id,
      fullscreen: widgetProps.fullscreen,
      autosize: widgetProps.autosize,
      theme: widgetProps.theme,
    };

    const tvWidget = new widget(widgetOptions);
    let clickSubscription: { unsubscribe: () => void } | undefined;

    tvWidget.onChartReady(() => {
      const activeChart =
        typeof tvWidget.activeChart === 'function'
          ? tvWidget.activeChart()
          : (tvWidget as any).activeChart?.();

      const chart = activeChart || (tvWidget as any).chart?.();

      const getPriceFromClick = (param: any) => {
        if (typeof param?.price === 'number') {
          return param.price;
        }

        const yCoord = param?.point?.y;
        const priceScale = chart?.priceScale?.('right') ?? chart?.priceScale?.();
        if (typeof yCoord === 'number' && priceScale?.coordinateToPrice) {
          const derivedPrice = priceScale.coordinateToPrice(yCoord);
          if (typeof derivedPrice === 'number' && !Number.isNaN(derivedPrice)) {
            return derivedPrice;
          }
        }

        return undefined;
      };

      if (chart?.onClick) {
        clickSubscription = chart.onClick().subscribe(null, (param: any) => {
          if (selectionModeRef.current === 'none') return;

          const price = getPriceFromClick(param);
          if (typeof price === 'number') {
            onPriceFromChart?.(price);
          }
        });
      }
    });

    return () => {
      clickSubscription?.unsubscribe?.();
      tvWidget.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    widgetProps.symbol,
    widgetProps.datafeed,
    widgetProps.interval,
    widgetProps.library_path,
    widgetProps.locale,
    widgetProps.charts_storage_url,
    widgetProps.charts_storage_api_version,
    widgetProps.client_id,
    widgetProps.user_id,
    widgetProps.fullscreen,
    widgetProps.autosize,
    widgetProps.theme,
    onPriceFromChart,
  ]);

  return (
    <>
      <div ref={chartContainerRef} className={styles.TVChartContainer} />
    </>
  );
};
