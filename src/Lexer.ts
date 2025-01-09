// Token types for Mermaid sequence diagrams
enum TokenType {
    SEQUENCE_START,    // sequenceDiagram
    PARTICIPANT,       // participant
    ACTOR,            // actor
    MESSAGE_ARROW,    // ->>, -->, ->, -->
    ACTIVATION,       // + or -
    COLON,           // :
    NEWLINE,         // \n
    IDENTIFIER,      // Names, messages
    WHITESPACE,      // Spaces, tabs
    EOF              // End of input
}

class Token {
    private TokenType type;
    private String value;
    private int line;
    private int column;
    
    public Token(TokenType type, String value, int line, int column) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }
    
    // Getters...
}

class Lexer {
    private String input;
    private int position = 0;
    private int line = 1;
    private int column = 1;
    
    public Lexer(String input) {
        this.input = input;
    }
    
    public Token nextToken() {
        skipWhitespace();
        
        if (position >= input.length()) {
            return new Token(TokenType.EOF, "", line, column);
        }
        
        char current = input.charAt(position);
        
        // Track starting position for error reporting
        int startColumn = column;
        
        // Match sequence diagram start
        if (matchKeyword("sequenceDiagram")) {
            return new Token(TokenType.SEQUENCE_START, "sequenceDiagram", line, startColumn);
        }
        
        // Match participant declaration
        if (matchKeyword("participant")) {
            return new Token(TokenType.PARTICIPANT, "participant", line, startColumn);
        }
        
        // Match actor declaration
        if (matchKeyword("actor")) {
            return new Token(TokenType.ACTOR, "actor", line, startColumn);
        }
        
        // Match arrows
        if (current == '-' || current == '=') {
            return scanArrow();
        }
        
        // Match activation/deactivation
        if (current == '+' || current == '-') {
            position++;
            column++;
            return new Token(TokenType.ACTIVATION, String.valueOf(current), line, startColumn);
        }
        
        // Match colon
        if (current == ':') {
            position++;
            column++;
            return new Token(TokenType.COLON, ":", line, startColumn);
        }
        
        // Match newline
        if (current == '\n') {
            position++;
            line++;
            column = 1;
            return new Token(TokenType.NEWLINE, "\n", line-1, startColumn);
        }
        
        // Match identifiers (participant names, messages)
        if (isIdentifierStart(current)) {
            return scanIdentifier();
        }
        
        // Unknown character
        throw new LexerException("Unexpected character: " + current, line, column);
    }
    
    private boolean matchKeyword(String keyword) {
        if (input.regionMatches(position, keyword, 0, keyword.length())) {
            // Make sure it's a complete word
            if (position + keyword.length() >= input.length() || 
                !isIdentifierPart(input.charAt(position + keyword.length()))) {
                position += keyword.length();
                column += keyword.length();
                return true;
            }
        }
        return false;
    }
    
    private Token scanArrow() {
        StringBuilder arrow = new StringBuilder();
        int startColumn = column;
        
        // Collect arrow characters
        while (position < input.length()) {
            char c = input.charAt(position);
            if (c == '-' || c == '>' || c == '=') {
                arrow.append(c);
                position++;
                column++;
            } else {
                break;
            }
        }
        
        String arrowStr = arrow.toString();
        if (isValidArrow(arrowStr)) {
            return new Token(TokenType.MESSAGE_ARROW, arrowStr, line, startColumn);
        }
        
        throw new LexerException("Invalid arrow syntax: " + arrowStr, line, startColumn);
    }
    
    private Token scanIdentifier() {
        StringBuilder identifier = new StringBuilder();
        int startColumn = column;
        
        while (position < input.length() && isIdentifierPart(input.charAt(position))) {
            identifier.append(input.charAt(position));
            position++;
            column++;
        }
        
        return new Token(TokenType.IDENTIFIER, identifier.toString(), line, startColumn);
    }
    
    private void skipWhitespace() {
        while (position < input.length()) {
            char c = input.charAt(position);
            if (c == ' ' || c == '\t' || c == '\r') {
                position++;
                column++;
            } else {
                break;
            }
        }
    }
    
    private boolean isIdentifierStart(char c) {
        return Character.isLetter(c) || c == '_';
    }
    
    private boolean isIdentifierPart(char c) {
        return Character.isLetterOrDigit(c) || c == '_' || c == '(' || c == ')';
    }
    
    private boolean isValidArrow(String arrow) {
        // Define valid arrow patterns: ->>, -->, ->, etc.
        return arrow.matches("(-{1,2}>|={1,2}>|-->>|==>>)");
    }
}

class LexerException extends RuntimeException {
    private int line;
    private int column;
    
    public LexerException(String message, int line, int column) {
        super(String.format("Line %d, Column %d: %s", line, column, message));
        this.line = line;
        this.column = column;
    }
}

// Example usage:
void example() {
    String input = """
        sequenceDiagram
            participant Client
            participant Server
            Client->>+Server: request()
            Server-->>-Client: response()
        """;
    
    Lexer lexer = new Lexer(input);
    Token token;
    do {
        token = lexer.nextToken();
        System.out.println(token);
    } while (token.getType() != TokenType.EOF);
}