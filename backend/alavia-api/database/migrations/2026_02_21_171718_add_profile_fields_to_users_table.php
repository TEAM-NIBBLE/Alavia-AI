<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->unique()->nullable()->after('email');
            $table->enum('language', ['EN', 'PIDGIN', 'YORUBA', 'HAUSA', 'IGBO'])->default('EN')->after('password');
            $table->string('emergency_contact_name')->nullable()->after('language');
            $table->string('emergency_contact_phone')->nullable()->after('emergency_contact_name');
            $table->string('refresh_token_hash')->nullable()->after('emergency_contact_phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['phone']);
            $table->dropColumn([
                'phone',
                'language',
                'emergency_contact_name',
                'emergency_contact_phone',
                'refresh_token_hash',
            ]);
        });
    }
};
