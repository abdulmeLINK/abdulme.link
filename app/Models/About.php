<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class About extends Model
{
    protected $connection = 'mysql';
    protected $table = 'abouts';

    protected $fillable = [
        'title',
        'name',
    ];

    public function skills()
    {
        return $this->embedsMany('App\Models\Skill');
    }
}
