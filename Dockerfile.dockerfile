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
    libbson-1.0

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install extensions
RUN pecl install mongodb && \
    docker-php-ext-enable mongodb && \
    docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Install composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

RUN cd /usr/local/etc/php/conf.d/ && \
    echo 'memory_limit = 512M' >> /usr/local/etc/php/conf.d/docker-php-ram-limit.ini

# Add user for laravel application
RUN groupadd -g 1000 www
RUN useradd -u 1000 -ms /bin/bash -g www www

# Copy existing application directory contents
COPY . /var/www

# Copy existing application directory permissions
COPY --chown=www:www . /var/www

# Create cache directory, laravel.log file, change ownership and permissions
RUN mkdir -p /var/www/bootstrap/cache && \
    touch /var/www/storage/logs/laravel.log && \
    chown -R www:www /var/www/bootstrap/cache /var/www/storage/logs/laravel.log && \
    chmod -R 755 /var/www/bootstrap/cache /var/www/storage/logs/laravel.log

# Change permissions for storage and cache directories
RUN chmod -R ugo+rw /var/www/storage && \
    chmod -R ugo+rw /var/www/bootstrap/cache

RUN mkdir -p /var/www/vendor && chown www:www /var/www/vendor

# Change current user to www
# ...

# Change current user to root
USER root

# Install composer dependencies
RUN cd /var/www && composer install

# Change current user back to www
USER www

# ...

# Expose port 80 and start php-fpm server
EXPOSE 80
CMD ["php-fpm"]