int i2c_addr()
{
    return 0x55;                    // 7-bit I2C slave address
}

void setup()
{
    setWAKE(0);                     // set reset pin to low
    delay_ms(5);                    // wait for 5ms
    setWAKE(1);                     // set reset pin to high
    delay_ms(65);                   // wait for 65ms
}

void loop()
{
    while (getINT() == 1)           // wait for INT to go low
        ;
    i2c_startread(0x12);            // start I2C read cycle

    int event_xy = 0;
    int xy = 0;
    int id = 0;

    while (id < 5)
    {
        event_xy = i2c_read8();     // read event and upper 3-bit of X and Y
        xy = i2c_read16be();        // read lower 8-bit of X and Y
        i2c_read8();                // read 1 byte

        if ((event_xy & 0x80) == 0x80)  // pressed
        {
            report_touch(id, (((event_xy << 4) & 0x700) | ((xy >> 8) & 0x00ff)),
                             (((event_xy << 8) & 0x700) | (xy & 0x00ff)));  // report id, X and Y values
        }
        id = id + 1;
    }

    i2c_stop();                     // end I2C read cycle
    while (getINT() == 0)           // wait for INT to go high
        ;
}