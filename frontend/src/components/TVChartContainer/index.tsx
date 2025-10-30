import styles from "./index.module.css";
import { useEffect, useRef } from "react";
import { ChartingLibraryWidgetOptions, LanguageCode, ResolutionString, widget } from "@/public/static/charting_library/charting_library";
import { UDFCompatibleDatafeed } from "@/public/static/datafeeds/udf/types";

export const TVChartContainer = (props: Partial<ChartingLibraryWidgetOptions>) => {
	const chartContainerRef =
		useRef<HTMLDivElement>() as React.MutableRefObject<HTMLInputElement>;

	useEffect(() => {
		const widgetOptions: ChartingLibraryWidgetOptions = {
			symbol: props.symbol,
			datafeed: props.datafeed as UDFCompatibleDatafeed,
			interval: props.interval as ResolutionString,
			container: chartContainerRef.current,
			library_path: props.library_path,
			locale: props.locale as LanguageCode,
			disabled_features: ["use_localstorage_for_settings", "header_symbol_search", "symbol_search_hot_key", 'header_compare', 'go_to_date'],
			enabled_features: ["study_templates", 'hide_resolution_in_legend'],
			charts_storage_url: props.charts_storage_url,
			charts_storage_api_version: props.charts_storage_api_version,
			client_id: props.client_id,
			user_id: props.user_id,
			fullscreen: props.fullscreen,
      autosize: props.autosize,
      theme: props.theme,
		};

		const tvWidget = new widget(widgetOptions);

    tvWidget.onChartReady(() => {
		});

		return () => {
			tvWidget.remove();
		};
	}, [props]);

	return (
		<>
			<div ref={chartContainerRef} className={styles.TVChartContainer} />
		</>
	);
};
