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
        // The create_users_table migration already defines these columns on fresh
        // installs, so only add what is missing and apply the 'EN' language default.
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->unique()->nullable()->after('email');
            }
            if (! Schema::hasColumn('users', 'emergency_contact_name')) {
                $table->string('emergency_contact_name')->nullable()->after('password');
            }
            if (! Schema::hasColumn('users', 'emergency_contact_phone')) {
                $table->string('emergency_contact_phone')->nullable()->after('emergency_contact_name');
            }
            if (! Schema::hasColumn('users', 'refresh_token_hash')) {
                $table->string('refresh_token_hash')->nullable()->after('emergency_contact_phone');
            }
        });

        if (Schema::hasColumn('users', 'language')) {
            Schema::table('users', function (Blueprint $table) {
                $table->enum('language', ['EN', 'PIDGIN', 'YORUBA', 'HAUSA', 'IGBO'])->default('EN')->change();
            });
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->enum('language', ['EN', 'PIDGIN', 'YORUBA', 'HAUSA', 'IGBO'])->default('EN')->after('password');
            });
        }
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
