<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Contact extends Model
{

    protected $fillable = [
        'name',
        'email',
        'message',
    ];
}
