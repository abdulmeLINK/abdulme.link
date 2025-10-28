<?php

namespace App\Exceptions;

use Exception;

class DataServiceException extends Exception
{
    protected $errorCode;
    protected $errorData;

    public function __construct(string $message = "", int $code = 500, string $errorCode = 'DATA_SERVICE_ERROR', array $errorData = [])
    {
        parent::__construct($message, $code);
        $this->errorCode = $errorCode;
        $this->errorData = $errorData;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getErrorData(): array
    {
        return $this->errorData;
    }

    public function render()
    {
        return response()->json([
            'success' => false,
            'error' => $this->getMessage(),
            'error_code' => $this->errorCode,
            'data' => $this->errorData,
        ], $this->getCode());
    }
}