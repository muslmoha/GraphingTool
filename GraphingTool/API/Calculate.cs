using MathNet.Numerics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Graping.Models;
using System;
using System.Text.Json;

namespace Graping.API
{
    [Route("api/[controller]")]
    [ApiController]
    public class Calculate : ControllerBase
    {
        [HttpGet]
        [Route("GetEquation")]
        public JsonResult GetEquation()
        {
            try
            {
                string jsonString = Request.Headers["Custom-Header"];
                var dataSet = JsonSerializer.Deserialize<Points>(jsonString);
                double[] xData = dataSet.xData;
                double[] yData = dataSet.yData;
                int order = dataSet.polyOrder;

                (double x, double y) p = Fit.Line(x: xData, y: yData);

                var coefficients = Fit.Polynomial(xData, yData, order);

                for (int i = 0; i < coefficients.Length; i++)
                {
                    coefficients[i] = Math.Round(coefficients[i], 2);
                }

                return new JsonResult(coefficients);
            }
            catch (Exception ex)
            {
                return new JsonResult(ex);
            }
            
        }
    }


}
