FROM php:8.2.14-fpm

# Copy composer.lock and composer.json
COPY composer.lock composer.json /var/www/
# Set working directory
WORKDIR /var/www

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    locales \
    zip \
    unzip \
    git \
    curl \
    libssl-dev \
    autoconf \
    pkg-config \
    libicu-dev \
    g++

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

RUN pear config-set php_ini "$PHP_INI_DIR"

# Install all necessary PHP extensions - tokenizer is built-in with PHP 8.2
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd intl xml dom

# Install composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Set memory limit for PHP
RUN cd /usr/local/etc/php/conf.d/ && \
    echo 'memory_limit = 512M' >> /usr/local/etc/php/conf.d/docker-php-ram-limit.ini

# Add user for laravel application
RUN groupadd -g 1000 www
RUN useradd -u 1000 -ms /bin/bash -g www www

# Create Laravel directory structure first
RUN mkdir -p /var/www/storage/logs \
    /var/www/storage/framework/sessions \
    /var/www/storage/framework/views \
    /var/www/storage/framework/cache \
    /var/www/bootstrap/cache \
    /var/www/public/js \
    /var/www/public/css \
    /var/www/resources/js

# Create Laravel log file
RUN touch /var/www/storage/logs/laravel.log

# Copy existing application directory contents
COPY . /var/www

# Copy existing application directory permissions
COPY --chown=www:www . /var/www

# Set proper permissions for Laravel directories
RUN chmod -R 777 /var/www/storage && \
    chmod -R 777 /var/www/bootstrap/cache && \
    chmod 666 /var/www/storage/logs/laravel.log && \
    chown -R www:www /var/www/storage /var/www/bootstrap/cache

# Ensure vendor directory exists and has proper permissions
RUN mkdir -p /var/www/vendor && chown www:www /var/www/vendor

# Change current user to www
USER www

RUN cd /var/www && composer install

# Configure PHP-FPM to listen on all interfaces
RUN sed -i 's/listen = 127.0.0.1:9000/listen = 9000/g' /usr/local/etc/php-fpm.d/www.conf || echo "Could not modify www.conf"

# Expose port 9000 for PHP-FPM
EXPOSE 9000
CMD ["php-fpm"]