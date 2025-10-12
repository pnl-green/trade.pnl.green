use tracing::{subscriber::set_global_default, Subscriber};
use tracing_bunyan_formatter::{BunyanFormattingLayer, JsonStorageLayer};
use tracing_log::LogTracer;
use tracing_subscriber::{fmt::MakeWriter, layer::SubscriberExt, EnvFilter, Registry};

/// Build a tracing subscriber that emits Bunyan-formatted JSON logs.
///
/// The subscriber wires together the following layers:
/// - [`EnvFilter`] sourced from the `RUST_LOG` environment variable (or a
///   provided fallback) to control which spans are recorded.
/// - [`JsonStorageLayer`] to retain span context data.
/// - [`BunyanFormattingLayer`] to write structured output to the provided sink.
///
/// The returned subscriber can be registered globally with [`init_subscriber`].
pub fn get_subscriber<Sink>(name: String, env_filter: &str, sink: Sink) -> impl Subscriber
where
    Sink: for<'a> MakeWriter<'a> + Send + Sync + 'static,
{
    // Derive the desired filter from the environment when available, falling
    // back to the supplied default so local development still produces logs.
    let env_filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new(env_filter));

    // Translate spans and events into Bunyan JSON lines while capturing span
    // data for downstream layers.
    let formatting_layer = BunyanFormattingLayer::new(name.into(), sink);

    // Layer the filter, JSON storage, and formatting on top of the default
    // registry so tracing captures span metadata before serialising it.
    Registry::default()
        .with(env_filter)
        .with(JsonStorageLayer)
        .with(formatting_layer)
}

/// Register the provided subscriber as the global default tracing backend.
///
/// Actix and other libraries log via the `log` crate, so we also install
/// [`LogTracer`] to forward those records into `tracing` before setting the
/// subscriber as the process-wide default.
pub fn init_subscriber(subscriber: impl Subscriber + Send + Sync) {
    // Enable the `log` crate to forward records into tracing.
    LogTracer::init().expect("Failed to set logger");
    // Register the provided subscriber as the process-global tracing backend.
    set_global_default(subscriber).expect("Failed to set subscriber");
}
