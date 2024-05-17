<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Contact;
use App\Mail\ContactFormSubmitted;

class ContactController extends Controller
{
    public function show()
    {
        return view('contact');
    }

    public function mail(Request $request)
    {
        return redirect('/contact')->with('success', 'Your message has been sent!');
        $validatedData = $request->validate([
            'name' => 'required',
            'email' => 'required|email',
            'message' => 'required',
            'g-recaptcha-response' => 'required|captcha',
        ]);


        $contact = new Contact($validatedData);
        $contact->save();

        return redirect('/contact')->with('success', 'Your message has been sent!');
    }
}
