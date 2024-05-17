<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

use MongoDB\Laravel\Eloquent\Model;

class Skill extends Model
{
    use HasFactory;
    protected $connection = 'mongodb';
    protected $collection = 'skills';
    protected $fillable = ['name', 'icon', 'description'];
}
