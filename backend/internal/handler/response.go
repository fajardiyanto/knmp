package handler

type Envelope struct {
	Data   any    `json:"data,omitempty"`
	Meta   any    `json:"meta,omitempty"`
	Error  string `json:"error,omitempty"`
	Errors any    `json:"errors,omitempty"`
}

func OKResponse(data any) Envelope {
	return Envelope{Data: data}
}

func PaginatedResponse(data any, meta any) Envelope {
	return Envelope{Data: data, Meta: meta}
}

func ErrorResponse(msg string) Envelope {
	return Envelope{Error: msg}
}

func ValidationErrorResponse(msg string, errors any) Envelope {
	return Envelope{Error: msg, Errors: errors}
}
