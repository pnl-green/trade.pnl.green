use std::{fs::File, io::Read};

use anyhow::Context;
use serde::Deserialize;

/// Strongly typed view over the environment variables required to boot the backend. Environment
/// loading happens at runtime so the same struct can be reused for different deployment targets.
#[derive(Debug, Deserialize)]
pub struct Config {
    server_host: String,
    server_port: u16,
    ws_host: String,
    ws_port: u16,

    /// Log level string consumed by the tracing subscriber builder.
    pub level: String,

    /// Redis connection string used by the session middleware.
    pub redis_url: String,

    /// Secret used to sign session cookies.
    pub cookie_key: String,

    /// CCXT service URL for v2 implementation.
    #[serde(default = "default_ccxt_service_url")]
    pub ccxt_service_url: String,
}

fn default_ccxt_service_url() -> String {
    "http://localhost:4001".to_string()
}

impl Config {
    /// Build a configuration instance using environment variables and `.env` fallbacks. This
    /// method is used from `main` so it bubbles up detailed context errors when things go wrong.
    pub fn new() -> Result<Self, anyhow::Error> {
        match envy::from_env() {
            Ok(config) => Ok(config),
            Err(_) => {
                // If the RUN_ENV is not set, default to an empty string i.e testnet env
                let run_env = &std::env::var("RUN_ENV").unwrap_or_else(|_| String::new());

                let file_path = format!(
                    ".env{}{}",
                    if run_env.is_empty() { "" } else { "." },
                    run_env
                );

                // Load the config based on the RUN_ENV
                Self::load(&file_path)?;

                Ok(envy::from_env().context(format!("Failed to read config for {}", file_path))?)
            }
        }
    }
}

impl Config {
    /// Helper that returns the HTTP bind target as `host:port`.
    pub fn server_url(&self) -> String {
        format!("{}:{}", self.server_host, self.server_port)
    }

    /// Helper that returns the websocket bind target as `host:port`.
    pub fn ws_url(&self) -> String {
        format!("{}:{}", self.ws_host, self.ws_port)
    }

    /// Helper that returns the CCXT service URL.
    pub fn ccxt_service_url(&self) -> &str {
        &self.ccxt_service_url
    }

    /// Allow integration tests to override the HTTP port while reusing the rest of the config.
    pub fn set_port(&mut self, port: u16) {
        self.server_port = port;
    }
}

impl Config {
    /// Load the config from the file
    fn load(file_path: &str) -> Result<(), anyhow::Error> {
        let mut file =
            File::open(file_path).with_context(|| format!("Failed to open file: {}", file_path))?;

        let mut content = String::new();

        file.read_to_string(&mut content)
            .with_context(|| format!("Failed to read file: {}", file_path))?;

        for line in content.lines() {
            match line.find('=') {
                Some(index) => {
                    let (key, value) = line.split_at(index);
                    let key = key.trim();
                    let value = value[1..].trim();

                    std::env::set_var(key, value);
                }
                None => {
                    tracing::warn!("Invalid line: {}", line);
                }
            }
        }

        Ok(())
    }
}
