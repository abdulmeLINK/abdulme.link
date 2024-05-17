<?php

namespace App\Http\Controllers;

use App\Models\FileSystem;
use Illuminate\Http\Request;

class FileSystemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //get all file system contents
        $contents = FileSystem::all();
        return response()->json($contents[0]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(FileSystem $fileSystem)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(FileSystem $fileSystem)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, FileSystem $fileSystem)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(FileSystem $fileSystem)
    {
        //
    }
}
