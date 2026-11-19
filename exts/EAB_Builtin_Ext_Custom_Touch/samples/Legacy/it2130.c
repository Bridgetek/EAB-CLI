int i2c_addr()
{
    return 0x41;                            // 7-bit I2C slave address
}

void setup()
{
    setWAKE(0);                             // set reset pin low
    delay_ms(30);                           // T1 timing, wait > 10ms, from section 2 Power Sequence
    setWAKE(1);                             // set reset pin high
    delay_ms(400);                          // T2 timing, from section 2 Power Sequence
}

void loop()
{
    while (getINT() == 1)                   // wait for INT to go low
        ;
    i2c_startread(0x10);                    // send a dummy command to start I2C read cycle
    i2c_read8();                            // read Report ID
    
    int event_id = 0;
    int x;
    int y;
    while ((event_id & 0xf) < 5)            // 1..5, support up to 5 touches
    {
        event_id = ((i2c_read8() << 8) | ((event_id & 0xf) + 1));   // read Tip Switch, Point ID and increase counter
        x = i2c_read16le();                 // read X direction coordinate
        y = i2c_read16le();                 // read Y direction coordinate

        if (event_id & 0x4000)              // check Tip Switch
        {
            report_touch(((event_id >> 8) & 0x3f), x, y);   // report id, X and Y values
        }
    }

    y = 0;
    event_id = (event_id & 0xf);
    while (y < (64-event_id*5-1))           // read the remaining bytes of a report
    {
        i2c_read8();                        // read 1 byte
        y = y + 1;
    }

    i2c_stop();                             // end I2C read cycle
    while (getINT() == 0)                   // wait for INT to go high
        ;
}
