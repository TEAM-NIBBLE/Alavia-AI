<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // List of {name, phone, relation}. The legacy emergency_contact_name/phone
            // columns mirror the first entry so existing readers keep working.
            $table->json('emergency_contacts')->nullable()->after('emergency_contact_phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('emergency_contacts');
        });
    }
};
