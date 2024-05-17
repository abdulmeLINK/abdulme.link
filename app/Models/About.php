<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class About extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'abouts';

    protected $fillable = [
        'title',
        'name',
        'skill_descrition',
        'description',
        'is_active',
    ];

    public function skills()
    {
        return $this->embedsMany('App\Models\Skill');
    }
}
