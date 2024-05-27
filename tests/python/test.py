from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium import webdriver
from selenium.webdriver.firefox.options import Options

options = Options()
options.set_preference("permissions.default.camera", 1)  # 1 means allow, 2 means deny

driver = webdriver.Firefox(options=options)

print('running')

def test_video_is_playing():
    try:
        driver.get('https://abdulme.link/whoami')
        video = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, 'video')))
        assert video.is_displayed()
        print("test_video_is_playing passed")
    except Exception as e:
        print("test_video_is_playing failed:", e)

def test_take_photo_button():
    try:
        button = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, 'startbutton')))
        button.click()
        canvas = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, 'canvas')))
        assert canvas.is_displayed()
        print("test_take_photo_button passed")
    except Exception as e:
        print("test_take_photo_button failed:", e)

from selenium.webdriver.support import expected_conditions as EC

def test_file_upload():
    try:
        upload = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, 'upload')))
        upload.send_keys('C:\\Users\\PC\\Desktop\\images.jpg')
        assert upload.get_attribute('value') != ''


        print("test_file_upload passed")
    except Exception as e:
        print("test_file_upload failed:", e)
        
def test_compare_button():
    try:
        # Click the compare button
        compare_button = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, '//button[@type="submit"]')))
        compare_button.click()

        # Wait for the results to be loaded and visible
        results = WebDriverWait(driver, 120).until(EC.visibility_of_element_located((By.ID, 'results')))
        assert results.is_displayed()

        print("test_compare_button passed")
    except Exception as e:
        print("test_compare_button failed:", e)

test_video_is_playing()
test_take_photo_button()
test_file_upload()
test_compare_button()
driver.quit()