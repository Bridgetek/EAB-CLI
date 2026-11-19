int i2c_addr()
{
    return 0x41;                    // 7-bit I2C slave address
}

void setup()
{
    setWAKE(0);                     // set reset pin to low
    delay_ms(30);                   // wait for 30ms
    setWAKE(1);                     // set reset pin to high
    delay_ms(300);                  // wait for 300ms
}

void loop()
{
    while (getINT() == 1)           // wait for INT to go low
        ;
    i2c_startread(0x10);            // start I2C read cycle
    i2c_read8();                    // read 1 byte
    
    int id = 0;
    int event_x;
    int y;
    while (id < 5)                  // 1..5, support up to 5 touches
    {
        event_x = i2c_read16be();   // read event and 15-bit X value
        y = i2c_read16be();         // read 15-bit Y value
        i2c_read8();                // read 1 byte

        if ((event_x & 0x8000) == 0x8000)   // pressed
        {
            report_touch(id, event_x & 0x7fff, y & 0x7fff); // report id, X and Y values
        }
        id = id + 1;
    }

    y = 0;
    while (y < (64-id*5-1))         // read the remaining bytes of a report
    {
        i2c_read8();
        y = y + 1;
    }

    i2c_stop();                     // end I2C read cycle
    while (getINT() == 0)           // wait for INT to go high
        ;
}
