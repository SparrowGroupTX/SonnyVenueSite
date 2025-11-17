package headfirst.designpatterns.observer.weather;

public class WeatherTodayDisplay implements Observer, DisplayElement {
    private float wind;
    private float dewPoint;
    private float uvIndex;
    private final WeatherData weatherData;

    public WeatherTodayDisplay(WeatherData weatherData) {
        this.weatherData = weatherData;
        weatherData.registerObserver(this);
    }

    public void update(float temp, float humidity, float pressure) {
        this.wind = weatherData.getWind();
        this.dewPoint = weatherData.getDewPoint();
        this.uvIndex = weatherData.getUvIndex();
        display();
    }

    public void display() {
        System.out.println("Weather Today: wind " + wind + " mph, dew point " + dewPoint + " F, UV index " + uvIndex);
    }
}
