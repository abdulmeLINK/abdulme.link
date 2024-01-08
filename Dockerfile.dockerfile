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
    curl

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

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

RUN mkdir -p /var/www/vendor
RUN chown -R www:www /var/www/vendor

# Create cache directory, change ownership and permissions
RUN mkdir -p /var/www/bootstrap/cache && \
    touch /var/www/storage/logs/laravel.log && \
    chown -R www:www /var/www/bootstrap/cache /var/www/storage/logs/laravel.log && \
    chmod -R 755 /var/www/bootstrap/cache /var/www/storage/logs/laravel.log

# Change current user to www
USER www

RUN cd /var/www && composer install

# Expose port 80 and start php-fpm server


EXPOSE 80
CMD ["php-fpm"]