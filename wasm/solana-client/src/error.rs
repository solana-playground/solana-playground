use http::StatusCode;
use std::fmt;

#[derive(Debug, Serialize, Deserialize)]
struct Error {
    code: u16,
    message: String,
}

impl Default for Error {
    fn default() -> Self {
        Self {
            code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
            message: StatusCode::INTERNAL_SERVER_ERROR.as_str().to_owned(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClientError {
    id: u16,
    jsonrpc: String,
    error: Error,
}

impl std::error::Error for ClientError {}

impl Default for ClientError {
    fn default() -> Self {
        Self {
            id: 0,
            jsonrpc: String::from("2.0"),
            error: Error::default(),
        }
    }
}

impl From<gloo_net::Error> for ClientError {
    fn from(error: gloo_net::Error) -> Self {
        ClientError {
            error: Error {
                code: StatusCode::INTERNAL_SERVER_ERROR.into(),
                message: error.to_string(),
            },
            ..Default::default()
        }
    }
}

impl ClientError {
    pub fn new(error_msg: impl ToString) -> Self {
        ClientError {
            error: Error {
                code: StatusCode::SEE_OTHER.as_u16(),
                message: error_msg.to_string(),
            },
            ..Default::default()
        }
    }

    pub fn new_with_status(code: u16, error_msg: impl ToString) -> Self {
        ClientError {
            error: Error {
                code,
                message: error_msg.to_string(),
            },
            ..Default::default()
        }
    }
}

impl fmt::Display for ClientError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(format!("Client error: {}", self.error.message).as_str())
    }
}
