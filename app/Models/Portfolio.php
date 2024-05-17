<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Portfolio extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'portfolios';
    protected $fillable = [
        'name', 'description', 'content', 'image', 'url'
    ];
}
