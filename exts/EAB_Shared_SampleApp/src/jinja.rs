
use serde_json::Value;

#[derive(Debug, Clone)]
pub enum Token {
    Text(String),
    Expr(String),
    Block(String),
}

#[derive(Debug, Clone)]
pub enum Node {
    Text(String),
    Expr(String),
    If {
        branches: Vec<(String, Vec<Node>)>,
        else_body: Vec<Node>,
    },
    For {
        var: String,
        iter_expr: String,
        body: Vec<Node>,
    },
}

pub fn py_str(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Bool(b) => {
            if *b {
                "True".to_string()
            } else {
                "False".to_string()
            }
        }
        Value::Null => "None".to_string(),
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                i.to_string()
            } else if let Some(f) = n.as_f64() {
                if f.fract() == 0.0 {
                    format!("{:.1}", f)
                } else {
                    format!("{}", f)
                }
            } else {
                n.to_string()
            }
        }
        Value::Array(_) | Value::Object(_) => "".to_string(),
    }
}

pub fn py_truthy(v: &Value) -> bool {
    match v {
        Value::Null => false,
        Value::Bool(b) => *b,
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                i != 0
            } else if let Some(f) = n.as_f64() {
                f != 0.0
            } else {
                false
            }
        }
        Value::String(s) => !s.is_empty(),
        Value::Array(a) => !a.is_empty(),
        Value::Object(o) => !o.is_empty(),
    }
}

pub fn lex(template: &str) -> Vec<Token> {
    let mut tokens: Vec<Token> = Vec::new();
    let bytes = template.as_bytes();
    let mut pos = 0usize;
    let mut lit_start = 0usize;
    let n = bytes.len();

    while pos < n {
                let mut open_pos: Option<usize> = None;
        let mut is_expr = false;
        let mut i = pos;
        while i + 1 < n {
            if bytes[i] == b'{' {
                if bytes[i + 1] == b'{' {
                    open_pos = Some(i);
                    is_expr = true;
                    break;
                } else if bytes[i + 1] == b'%' {
                    open_pos = Some(i);
                    is_expr = false;
                    break;
                }
            }
            i += 1;
        }

        match open_pos {
            None => break,
            Some(op) => {
                                let lit = &template[lit_start..op];

                if !is_expr {
                                        tokens.push(Token::Text(lstrip_block_whitespace(lit)));
                } else {
                    tokens.push(Token::Text(lit.to_string()));
                }

                                let close = if is_expr { b"}}" } else { b"%}" };
                let mut cp = op + 2;
                let mut closed = None;
                while cp + 1 < n {
                    if bytes[cp] == close[0] && bytes[cp + 1] == close[1] {
                        closed = Some(cp);
                        break;
                    }
                    cp += 1;
                }
                let close_pos = match closed {
                    Some(c) => c,
                    None => break,
                };

                let inner = template[op + 2..close_pos].trim().to_string();
                if is_expr {
                    tokens.push(Token::Expr(inner));
                    pos = close_pos + 2;
                } else {
                    tokens.push(Token::Block(inner));
                                        let after = close_pos + 2;
                    if after < n && bytes[after] == b'\r' && after + 1 < n && bytes[after + 1] == b'\n'
                    {
                        pos = after + 2;
                    } else if after < n && bytes[after] == b'\n' {
                        pos = after + 1;
                    } else {
                        pos = after;
                    }
                }
                lit_start = pos;
            }
        }
    }

        let tail = &template[lit_start..];
    if !tail.is_empty() {
        tokens.push(Token::Text(tail.to_string()));
    }

        tokens.retain(|t| match t {
        Token::Text(s) => !s.is_empty(),
        _ => true,
    });
    tokens
}

fn lstrip_block_whitespace(lit: &str) -> String {
        if let Some(idx) = lit.rfind('\n') {
        let after = &lit[idx + 1..];
        if !after.is_empty() && after.chars().all(|c| c == ' ' || c == '\t') {
            return lit[..idx + 1].to_string();
        }
    } else {
        if !lit.is_empty() && lit.chars().all(|c| c == ' ' || c == '\t') {
            return String::new();
        }
    }
    lit.to_string()
}

pub fn parse(tokens: &[Token]) -> Vec<Node> {
    let mut nodes = Vec::new();
    let mut idx = 0;
    parse_until(tokens, &mut idx, &mut nodes, &["endif", "endfor", "else", "elif"]);
    nodes
}

fn parse_until(tokens: &[Token], idx: &mut usize, out: &mut Vec<Node>, stops: &[&str]) {
    while *idx < tokens.len() {
        match &tokens[*idx] {
            Token::Text(s) => {
                out.push(Node::Text(s.clone()));
                *idx += 1;
            }
            Token::Expr(e) => {
                out.push(Node::Expr(e.clone()));
                *idx += 1;
            }
            Token::Block(b) => {
                let trimmed = b.trim();
                if let Some(stop) = stops.iter().find(|s| trimmed.starts_with(**s)) {
                    let _ = stop;
                    return;
                }
                if trimmed.starts_with("if ") || trimmed.starts_with("if\t") {
                    let mut cond = trimmed[2..].trim().to_string();
                    *idx += 1;
                    let mut branches: Vec<(String, Vec<Node>)> = Vec::new();
                    let mut body: Vec<Node> = Vec::new();
                    let mut else_body: Vec<Node> = Vec::new();
                    loop {
                        let mut sub: Vec<Node> = Vec::new();
                        parse_until(tokens, idx, &mut sub, &["endif", "else", "elif"]);
                        body.extend(sub);
                        if *idx >= tokens.len() {
                            break;
                        }
                        let b2 = match &tokens[*idx] {
                            Token::Block(bb) => bb.trim().to_string(),
                            _ => break,
                        };
                        if b2.starts_with("else") {
                            *idx += 1;
                            let mut sub2: Vec<Node> = Vec::new();
                            parse_until(tokens, idx, &mut sub2, &["endif"]);
                            else_body.extend(sub2);
                            *idx += 1;
                            break;
                        } else if b2.starts_with("elif") {
                            let c2 = b2[4..].trim().to_string();
                            branches.push((cond.clone(), body.clone()));
                            cond = c2;
                            body = Vec::new();
                            *idx += 1;
                            continue;
                        } else {
                                                        *idx += 1;
                            break;
                        }
                    }
                    branches.push((cond, body));
                    out.push(Node::If { branches, else_body });
                } else if trimmed.starts_with("for ") {
                    let rest = trimmed[3..].trim().to_string();
                    let mut parts = rest.splitn(3, " in ");
                    let var = parts.next().unwrap_or("").trim().to_string();
                    let iter_expr = parts.next().unwrap_or("").trim().to_string();
                    *idx += 1;
                    let mut body: Vec<Node> = Vec::new();
                    parse_until(tokens, idx, &mut body, &["endfor"]);
                    *idx += 1;
                    out.push(Node::For { var, iter_expr, body });
                } else {
                                        *idx += 1;
                }
            }
        }
    }
}

#[derive(Clone)]
enum Expr {
    Lit(Value),
    Path(Vec<PathPart>),
    Func { name: String, args: Vec<Expr> },
    Bin(BinOp, Box<Expr>, Box<Expr>),
}

#[derive(Clone, Copy, PartialEq, Debug)]
enum BinOp {
    Eq,
    Ne,
    In,
    Or,
    And,
}

#[derive(Clone, Debug)]
enum PathPart {
    Key(String),
    Index(usize),
}

fn tokenize_expr(s: &str) -> Result<Vec<String>, String> {
    let mut toks = Vec::new();
    let chars: Vec<char> = s.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        if c.is_whitespace() {
            i += 1;
            continue;
        }
        if c == '"' || c == '\'' {
            let quote = c;
            let mut j = i + 1;
            let mut out = String::new();
            while j < chars.len() && chars[j] != quote {
                if chars[j] == '\\' && j + 1 < chars.len() {
                    j += 1;
                    match chars[j] {
                        'n' => out.push('\n'),
                        't' => out.push('\t'),
                        'r' => out.push('\r'),
                        '"' => out.push('"'),
                        '\'' => out.push('\''),
                        '\\' => out.push('\\'),
                        c => out.push(c),
                    }
                } else {
                    out.push(chars[j]);
                }
                j += 1;
            }
            toks.push(format!("\x00STR{}\x00", out));
            i = j + 1;
            continue;
        }
        if c.is_ascii_digit() || (c == '-' && i + 1 < chars.len() && chars[i + 1].is_ascii_digit()) {
            let mut j = i + 1;
            while j < chars.len() && (chars[j].is_ascii_digit()) {
                j += 1;
            }
            toks.push(chars[i..j].iter().collect());
            i = j;
            continue;
        }
        if c.is_alphabetic() || c == '_' {
            let mut j = i;
            while j < chars.len() && (chars[j].is_alphanumeric() || chars[j] == '_') {
                j += 1;
            }
            toks.push(chars[i..j].iter().collect());
            i = j;
            continue;
        }
                let two: String = if i + 1 < chars.len() {
            chars[i..i + 2].iter().collect()
        } else {
            String::new()
        };
        match two.as_str() {
            "==" | "!=" => {
                toks.push(two);
                i += 2;
                continue;
            }
            _ => {}
        }
        toks.push(c.to_string());
        i += 1;
    }
    Ok(toks)
}

fn parse_expr(s: &str) -> Result<Expr, String> {
    let toks = tokenize_expr(s)?;
    let mut pos = 0;
    let e = parse_or(&toks, &mut pos)?;
    if pos < toks.len() {
        return Err(format!("unexpected token '{}' in expr '{}'", toks[pos], s));
    }
    Ok(e)
}

fn parse_or(toks: &[String], pos: &mut usize) -> Result<Expr, String> {
    let mut left = parse_and(toks, pos)?;
    while *pos < toks.len() && toks[*pos] == "or" {
        *pos += 1;
        let right = parse_and(toks, pos)?;
        left = Expr::Bin(BinOp::Or, Box::new(left), Box::new(right));
    }
    Ok(left)
}

fn parse_and(toks: &[String], pos: &mut usize) -> Result<Expr, String> {
    let mut left = parse_cmp(toks, pos)?;
    while *pos < toks.len() && toks[*pos] == "and" {
        *pos += 1;
        let right = parse_cmp(toks, pos)?;
        left = Expr::Bin(BinOp::And, Box::new(left), Box::new(right));
    }
    Ok(left)
}

fn parse_cmp(toks: &[String], pos: &mut usize) -> Result<Expr, String> {
    let mut left = parse_primary(toks, pos)?;
    loop {
        if *pos < toks.len() {
            match toks[*pos].as_str() {
                "==" => {
                    *pos += 1;
                    let right = parse_primary(toks, pos)?;
                    left = Expr::Bin(BinOp::Eq, Box::new(left), Box::new(right));
                    continue;
                }
                "!=" => {
                    *pos += 1;
                    let right = parse_primary(toks, pos)?;
                    left = Expr::Bin(BinOp::Ne, Box::new(left), Box::new(right));
                    continue;
                }
                "in" => {
                    *pos += 1;
                    let right = parse_primary(toks, pos)?;
                    left = Expr::Bin(BinOp::In, Box::new(left), Box::new(right));
                    continue;
                }
                _ => {}
            }
        }
        break;
    }
    Ok(left)
}

fn parse_primary(toks: &[String], pos: &mut usize) -> Result<Expr, String> {
    if *pos >= toks.len() {
        return Err("unexpected end of expression".to_string());
    }
    let t = toks[*pos].clone();
    if t.starts_with("\x00STR") && t.ends_with('\x00') {
        *pos += 1;
        return Ok(Expr::Lit(Value::String(t[4..t.len() - 1].to_string())));
    }
    if t.chars().all(|c| c.is_ascii_digit()) || (t.starts_with('-') && t[1..].chars().all(|c| c.is_ascii_digit())) {
        *pos += 1;
        let n: i64 = t.parse().unwrap_or(0);
        return Ok(Expr::Lit(Value::from(n)));
    }
    if t == "(" {
        *pos += 1;
        let e = parse_or(toks, pos)?;
        if *pos < toks.len() && toks[*pos] == ")" {
            *pos += 1;
        }
        return Ok(e);
    }
    if t == "True" || t == "true" {
        *pos += 1;
        return Ok(Expr::Lit(Value::Bool(true)));
    }
    if t == "False" || t == "false" {
        *pos += 1;
        return Ok(Expr::Lit(Value::Bool(false)));
    }
    if t == "None" || t == "null" {
        *pos += 1;
        return Ok(Expr::Lit(Value::Null));
    }
        if t.chars().all(|c| c.is_alphanumeric() || c == '_') {
                if *pos + 1 < toks.len() && toks[*pos + 1] == "(" {
            let name = t;
            *pos += 2;
            let mut args = Vec::new();
            if *pos < toks.len() && toks[*pos] == ")" {
                *pos += 1;
            } else {
                loop {
                    let a = parse_or(toks, pos)?;
                    args.push(a);
                    if *pos < toks.len() && toks[*pos] == "," {
                        *pos += 1;
                        continue;
                    }
                    break;
                }
                if *pos < toks.len() && toks[*pos] == ")" {
                    *pos += 1;
                }
            }
            return Ok(Expr::Func { name, args });
        }
                let mut parts: Vec<PathPart> = Vec::new();
        parts.push(PathPart::Key(t));
        *pos += 1;
        loop {
            if *pos < toks.len() && toks[*pos] == "." {
                *pos += 1;
                if *pos < toks.len() {
                    parts.push(PathPart::Key(toks[*pos].clone()));
                    *pos += 1;
                }
            } else if *pos < toks.len() && toks[*pos] == "[" {
                *pos += 1;
                if *pos < toks.len() && toks[*pos].chars().all(|c| c.is_ascii_digit()) {
                    let idx: usize = toks[*pos].parse().unwrap_or(0);
                    parts.push(PathPart::Index(idx));
                    *pos += 1;
                }
                if *pos < toks.len() && toks[*pos] == "]" {
                    *pos += 1;
                }
            } else {
                break;
            }
        }
        return Ok(Expr::Path(parts));
    }
    Err(format!("unexpected token '{}'", t))
}

pub struct Context {
    pub values: Vec<(String, Value)>,
    pub functions: Vec<(String, fn(&[Value]) -> Value)>,
}

impl Context {
    pub fn new() -> Self {
        Context {
            values: Vec::new(),
            functions: Vec::new(),
        }
    }
    pub fn set(&mut self, name: &str, v: Value) {
        if let Some(e) = self.values.iter_mut().find(|(k, _)| k == name) {
            e.1 = v;
        } else {
            self.values.push((name.to_string(), v));
        }
    }
    pub fn set_fn(&mut self, name: &str, f: fn(&[Value]) -> Value) {
        self.functions.push((name.to_string(), f));
    }
    pub fn get(&self, name: &str) -> Option<&Value> {
        self.values.iter().rev().find(|(k, _)| k == name).map(|(_, v)| v)
    }
}

fn get_path<'a>(base: &'a Value, parts: &[PathPart]) -> Value {
    let mut cur = base.clone();
    for p in parts {
        match p {
            PathPart::Key(k) => match &cur {
                Value::Object(o) => {
                    cur = o.get(k).cloned().unwrap_or(Value::Null);
                }
                _ => {
                    cur = Value::Null;
                }
            },
            PathPart::Index(i) => match &cur {
                Value::Array(a) => {
                    cur = a.get(*i).cloned().unwrap_or(Value::Null);
                }
                _ => {
                    cur = Value::Null;
                }
            },
        }
    }
    cur
}

fn eval_expr(expr: &Expr, ctx: &Context) -> Value {
    match expr {
        Expr::Lit(v) => v.clone(),
        Expr::Path(parts) => {
                        if parts.is_empty() {
                return Value::Null;
            }
            let first = match parts[0] {
                PathPart::Key(ref k) => k.clone(),
                PathPart::Index(_) => return Value::Null,
            };
            let base = ctx.get(&first).cloned().unwrap_or(Value::Null);
            get_path(&base, &parts[1..])
        }
        Expr::Func { name, args } => {
            let arg_vals: Vec<Value> = args.iter().map(|a| eval_expr(a, ctx)).collect();
            if name == "raise" {
                let msg = arg_vals
                    .first()
                    .and_then(|v| v.as_str())
                    .unwrap_or("raise");
                eprintln!("Jinja raise: {msg}");
                return Value::Null;
            }
            if let Some((_, f)) = ctx.functions.iter().find(|(k, _)| k == name) {
                return f(&arg_vals);
            }
            Value::Null
        }
        Expr::Bin(op, l, r) => {
            let lv = eval_expr(l, ctx);
            let rv = eval_expr(r, ctx);
            match op {
                BinOp::Eq => Value::Bool(py_str(&lv) == py_str(&rv)),
                BinOp::Ne => Value::Bool(py_str(&lv) != py_str(&rv)),
                BinOp::In => {
                                        let s = match &rv {
                        Value::String(s) => s.clone(),
                        _ => py_str(&rv),
                    };
                    Value::Bool(s.contains(&py_str(&lv)))
                }
                BinOp::Or => {
                    if py_truthy(&lv) {
                        lv
                    } else {
                        rv
                    }
                }
                BinOp::And => {
                    if py_truthy(&lv) {
                        rv
                    } else {
                        lv
                    }
                }
            }
        }
    }
}

fn render_nodes(nodes: &[Node], ctx: &Context, out: &mut String) {
    for node in nodes {
        match node {
            Node::Text(s) => out.push_str(s),
            Node::Expr(e) => {
                if let Ok(expr) = parse_expr(e) {
                    let v = eval_expr(&expr, ctx);
                    out.push_str(&py_str(&v));
                }
            }
            Node::If { branches, else_body } => {
                let mut taken = false;
                for (cond, body) in branches {
                    if !taken {
                        if let Ok(expr) = parse_expr(cond) {
                            let v = eval_expr(&expr, ctx);
                            if py_truthy(&v) {
                                render_nodes(body, ctx, out);
                                taken = true;
                            }
                        }
                    }
                }
                if !taken {
                    render_nodes(else_body, ctx, out);
                }
            }
            Node::For { var, iter_expr, body } => {
                if let Ok(expr) = parse_expr(iter_expr) {
                    let v = eval_expr(&expr, ctx);
                    if let Value::Array(items) = &v {
                        for item in items {
                            let mut sub_ctx = clone_ctx(ctx);
                            sub_ctx.set(var, item.clone());
                            render_nodes(body, &sub_ctx, out);
                        }
                    }
                }
            }
        }
    }
}

fn clone_ctx(ctx: &Context) -> Context {
    Context {
        values: ctx.values.clone(),
        functions: ctx.functions.clone(),
    }
}

pub fn render(template: &str, ctx: &Context) -> String {
    let tokens = lex(template);
    let nodes = parse(&tokens);
    let mut out = String::new();
    render_nodes(&nodes, ctx, &mut out);
    out
}

pub fn chip_support_fn(args: &[Value]) -> Value {
        let chip_num = 5i64;
    for a in args {
        if let Some(i) = a.as_i64() {
            if i == chip_num {
                return Value::Bool(true);
            }
        }
    }
    Value::Bool(false)
}

pub fn get_compression_enum_string_fn(args: &[Value]) -> Value {
    let v = args.first().and_then(|a| a.as_i64()).unwrap_or(0);
    let s = match v {
        0 => "FLASH_COMPRESS_RAW",
        1 => "FLASH_COMPRESS_ZLIB",
        2 => "FLASH_COMPRESS_RELOC",
        _ => "FLASH_COMPRESS_RAW",
    };
    Value::String(s.to_string())
}

pub fn get_asset_type_enum_string_fn(args: &[Value]) -> Value {
    let v = args.first().and_then(|a| a.as_i64()).unwrap_or(0) as u8;
    let s = match v {
        0x00 => "FLASH_ASSET_TYPE_NONE",
        0x01 => "FLASH_ASSET_TYPE_FLASH_DRIVER",
        0x02 => "FLASH_ASSET_TYPE_BITMAP",
        0x03 => "FLASH_ASSET_TYPE_BITMAP_PALETTED_INDEX",
        0x04 => "FLASH_ASSET_TYPE_BITMAP_PALETTED_LUT",
        0x05 => "FLASH_ASSET_TYPE_DXT1",
        0x07 => "FLASH_ASSET_TYPE_PNG_JPEG",
        0x20 => "FLASH_ASSET_TYPE_ANIMATION_LEGACY",
        0x21 => "FLASH_ASSET_TYPE_ANIMATION_BT82X",
        0x30 => "FLASH_ASSET_TYPE_AUDIO_LEGACY",
        0x31 => "FLASH_ASSET_TYPE_AUDIO_BT82X",
        0x50 => "FLASH_ASSET_TYPE_VIDEO_LEGACY",
        0x51 => "FLASH_ASSET_TYPE_VIDEO_BT82X",
        0x70 => "FLASH_ASSET_TYPE_FONT_LEGACY_LEGACY",
        0x71 => "FLASH_ASSET_TYPE_FONT_EXTENDED_LEGACY",
        0x80 => "FLASH_ASSET_TYPE_FONT_LEGACY_BT82X",
        0x81 => "FLASH_ASSET_TYPE_FONT_EXTENDED1_BT82X",
        0x82 => "FLASH_ASSET_TYPE_FONT_EXTENDED2_BT82X",
        0xFC => "FLASH_ASSET_TYPE_PADDING_DATA",
        0xFD => "FLASH_ASSET_TYPE_EDF_BLOCK",
        0xFE => "FLASH_ASSET_TYPE_USER_DATA",
        _ => "FLASH_ASSET_TYPE_NONE",
    };
    Value::String(s.to_string())
}

pub fn get_asset_subtype_enum_string_fn(args: &[Value]) -> Value {
    let tv = args.first().and_then(|a| a.as_i64()).unwrap_or(0) as u8;
    let sv = args.get(1).and_then(|a| a.as_i64()).unwrap_or(0) as u16;

    let s = match tv {
        0x02 | 0x03 | 0x04 => match sv {
            0 => "FLASH_ASSET_SUBTYPE_ARGB1555",
            1 => "FLASH_ASSET_SUBTYPE_L1",
            2 => "FLASH_ASSET_SUBTYPE_L4",
            3 => "FLASH_ASSET_SUBTYPE_L8",
            4 => "FLASH_ASSET_SUBTYPE_RGB332",
            5 => "FLASH_ASSET_SUBTYPE_ARGB2",
            6 => "FLASH_ASSET_SUBTYPE_ARGB4",
            7 => "FLASH_ASSET_SUBTYPE_RGB565",
            17 => "FLASH_ASSET_SUBTYPE_L2",
            19 => "FLASH_ASSET_SUBTYPE_RGB8",
            20 => "FLASH_ASSET_SUBTYPE_ARGB8",
            21 => "FLASH_ASSET_SUBTYPE_PALETTEDARGB8",
            22 => "FLASH_ASSET_SUBTYPE_RGB6",
            23 => "FLASH_ASSET_SUBTYPE_ARGB6",
            24 => "FLASH_ASSET_SUBTYPE_LA1",
            25 => "FLASH_ASSET_SUBTYPE_LA2",
            26 => "FLASH_ASSET_SUBTYPE_LA4",
            27 => "FLASH_ASSET_SUBTYPE_LA8",
            28 => "FLASH_ASSET_SUBTYPE_YCBCR",
            37808 => "FLASH_ASSET_SUBTYPE_ASTC_4x4",
            37809 => "FLASH_ASSET_SUBTYPE_ASTC_5x4",
            37810 => "FLASH_ASSET_SUBTYPE_ASTC_5x5",
            37811 => "FLASH_ASSET_SUBTYPE_ASTC_6x5",
            37812 => "FLASH_ASSET_SUBTYPE_ASTC_6x6",
            37813 => "FLASH_ASSET_SUBTYPE_ASTC_8x5",
            37814 => "FLASH_ASSET_SUBTYPE_ASTC_8x6",
            37815 => "FLASH_ASSET_SUBTYPE_ASTC_8x8",
            37816 => "FLASH_ASSET_SUBTYPE_ASTC_10x5",
            37817 => "FLASH_ASSET_SUBTYPE_ASTC_10x6",
            37818 => "FLASH_ASSET_SUBTYPE_ASTC_10x8",
            37819 => "FLASH_ASSET_SUBTYPE_ASTC_10x10",
            37820 => "FLASH_ASSET_SUBTYPE_ASTC_12x10",
            37821 => "FLASH_ASSET_SUBTYPE_ASTC_12x12",
            _ => "FLASH_ASSET_SUBTYPE_NONE",
        },
        0x05 => match sv {
            0xdd00 => "FLASH_ASSET_SUBTYPE_DXT1_L1_RGB565",
            0xdd01 => "FLASH_ASSET_SUBTYPE_DXT1_L1_PALETTED565",
            0xdd02 => "FLASH_ASSET_SUBTYPE_DXT1_L2_RGB565",
            0xdd03 => "FLASH_ASSET_SUBTYPE_DXT1_L2_PALETTED565",
            _ => "FLASH_ASSET_SUBTYPE_DXT1_L1_RGB565",
        },
        0x20 | 0x21 => match sv {
            0xaa00 => "FLASH_ASSET_SUBTYPE_ANIMATION_FLASH_LEGACY",
            0xaa01 => "FLASH_ASSET_SUBTYPE_ANIMATION_RAMG_LEGACY",
            _ => "FLASH_ASSET_SUBTYPE_ANIMATION_FLASH_LEGACY",
        },
        0x30 | 0x31 => match sv {
            0xad00 => "FLASH_ASSET_SUBTYPE_AUDIO_RAW_LINEAR",
            0xad01 => "FLASH_ASSET_SUBTYPE_AUDIO_RAW_ULAW",
            0xad02 => "FLASH_ASSET_SUBTYPE_AUDIO_RAW_4BIT_IMA_ADPCM",
            0xad03 => "FLASH_ASSET_SUBTYPE_AUDIO_RAW_S16",
            0xad04 => "FLASH_ASSET_SUBTYPE_AUDIO_RAW_S16S",
            0xad10 => "FLASH_ASSET_SUBTYPE_AUDIO_WAV_LINEAR",
            0xad11 => "FLASH_ASSET_SUBTYPE_AUDIO_WAV_ULAW",
            0xad12 => "FLASH_ASSET_SUBTYPE_AUDIO_WAV_4BIT_IMA_ADPCM",
            0xad13 => "FLASH_ASSET_SUBTYPE_AUDIO_WAV_S16",
            0xad14 => "FLASH_ASSET_SUBTYPE_AUDIO_WAV_S16S",
            _ => "FLASH_ASSET_SUBTYPE_AUDIO_RAW_LINEAR",
        },
        _ => "FLASH_ASSET_SUBTYPE_NONE",
    };
    Value::String(s.to_string())
}
