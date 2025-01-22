class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong, please try again later",
        errors = [],
        statck = ""
    ){
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors; //this.errors = errors;

        if(statck){
            this.statck = statck;
        } else {
            Error.captureStackTrace(this,this.constructor)
        }

    }
}

export {ApiError};