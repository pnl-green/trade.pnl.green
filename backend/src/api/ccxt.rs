use std::io::{Read, Write};
use std::net::TcpStream;

use actix_web::{http::StatusCode, web, HttpRequest, HttpResponse};

use crate::{error::Error, prelude::Result, Config};

pub async fn proxy(
    path: web::Path<String>,
    req: HttpRequest,
    body: web::Bytes,
    config: web::Data<Config>,
) -> Result<HttpResponse> {
    let mut url = format!("{}/api/{}", config.ccxt_service_url(), path.into_inner());

    if !req.query_string().is_empty() {
        url.push('?');
        url.push_str(req.query_string());
    }

    let method = req.method().as_str().to_owned();
    let payload = if body.is_empty() {
        None
    } else {
        Some(body.to_vec())
    };

    let response = actix_web::rt::task::spawn_blocking(move || forward_request(&method, &url, payload.as_deref()))
        .await
        .map_err(|err| Error::UnexpectedError(err.into()))??;

    Ok(HttpResponse::build(response.status).body(response.body))
}

struct ForwardResponse {
    status: StatusCode,
    body: Vec<u8>,
}

fn forward_request(method: &str, url: &str, body: Option<&[u8]>) -> Result<ForwardResponse> {
    let (host, port, path) = parse_http_url(url)?;

    let mut stream = TcpStream::connect((host.as_str(), port))?;

    let mut request = format!("{} {} HTTP/1.1\r\nHost: {}\r\nConnection: close\r\n", method, path, host);

    if let Some(body) = body {
        request.push_str("Content-Type: application/json\r\n");
        request.push_str(&format!("Content-Length: {}\r\n", body.len()));
    }

    request.push_str("\r\n");

    if let Some(body) = body {
        stream.write_all(request.as_bytes())?;
        stream.write_all(body)?;
    } else {
        stream.write_all(request.as_bytes())?;
    }

    stream.flush()?;

    let mut response = String::new();
    stream.read_to_string(&mut response)?;

    let mut sections = response.splitn(2, "\r\n\r\n");
    let head = sections.next().unwrap_or("");
    let body = sections.next().unwrap_or("").as_bytes().to_vec();

    let mut head_lines = head.lines();
    let status_line = head_lines.next().unwrap_or("HTTP/1.1 502");
    let status_code = status_line
        .split_whitespace()
        .nth(1)
        .and_then(|s| s.parse::<u16>().ok())
        .and_then(|code| StatusCode::from_u16(code).ok())
        .unwrap_or(StatusCode::BAD_GATEWAY);

    Ok(ForwardResponse {
        status: status_code,
        body,
    })
}

fn parse_http_url(url: &str) -> Result<(String, u16, String)> {
    let without_scheme = url
        .strip_prefix("http://")
        .ok_or_else(|| Error::BadRequestError("Only http:// URLs are supported".into()))?;

    let mut parts = without_scheme.splitn(2, '/');
    let host_port = parts.next().unwrap_or("");
    let path = parts
        .next()
        .map(|p| format!("/{}", p))
        .unwrap_or_else(|| "/".to_string());

    let mut host_parts = host_port.splitn(2, ':');
    let host = host_parts
        .next()
        .ok_or_else(|| Error::BadRequestError("Invalid host".into()))?
        .to_string();
    let port = host_parts
        .next()
        .unwrap_or("80")
        .parse::<u16>()
        .map_err(|_| Error::BadRequestError("Invalid port".into()))?;

    Ok((host, port, path))
}
